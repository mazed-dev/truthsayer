import browser from 'webextension-polyfill'
import { log, genOriginId, unixtime, OriginIdentity, Timer } from 'armoury'
import { StorageApi } from 'smuggler-api'

// See https://developer.chrome.com/docs/extensions/reference/webNavigation/#type-TransitionType
type TransitionType =
  | 'link'
  | 'typed'
  | 'auto_bookmark'
  | 'auto_subframe'
  | 'manual_subframe'
  | 'generated'
  | 'start_page'
  | 'form_submit'
  | 'reload'
  | 'keyword'
  | 'keyword_generated'

// See https://developer.chrome.com/docs/extensions/reference/webNavigation/#transition-types-and-qualifiers
type TransitionQualifier =
  | 'client_redirect' // One or more redirects caused by JavaScript or meta refresh tags on the page happened during the navigation.
  | 'server_redirect' // One or more redirects caused by HTTP headers sent from the server happened during the navigation.
  | 'forward_back' // The user used the Forward or Back button to initiate the navigation.
  | 'from_address_bar' // The user initiated the navigation from the address bar (aka Omnibox).

/**
 * Transition state for each tab for navigation tracking
 */
type TabNavigationTransition = {
  /**
   * Source of the transition, if known
   */
  source?: {
    url: string
  }
  transitionType?: TransitionType
  transitionQualifiers?: TransitionQualifier[]
}

function isRelationTransition(
  transition: TabNavigationTransition,
  destinationUrl: string
): boolean {
  return (
    transition.source?.url != null &&
    // To avoid loop transitions from page to itself
    transition.source.url !== destinationUrl &&
    !transition.transitionQualifiers?.includes('from_address_bar') &&
    !transition.transitionQualifiers?.includes('forward_back')
  )
}

const _tabTransitionState: Record<number, TabNavigationTransition | undefined> =
  {}

async function reportAssociation(
  storage: StorageApi,
  fromUrlUnstable: string,
  toUrlUnstable: string
): Promise<void> {
  const { id: fromId, stableUrl: fromUrl } = genOriginId(fromUrlUnstable)
  const { id: toId, stableUrl: toUrl } = genOriginId(toUrlUnstable)
  await storage.activity.association.record({
    origin: {
      from: { id: fromId },
      to: { id: toId },
    },
    body: {
      association: {
        web_transition: {
          from_url: fromUrl,
          to_url: toUrl,
        },
      },
    },
  })
}

async function reportVisit(
  storage: StorageApi,
  origin: OriginIdentity
): Promise<void> {
  await storage.activity.external.add({
    origin: { id: origin.id },
    activity: {
      visit: {
        visits: [{ timestamp: unixtime.now() }],
      },
    },
  })
}

const onCompletedListener = async (
  storage: StorageApi,
  details: browser.WebNavigation.OnCompletedDetailsType
) => {
  if (details.frameId === 0) {
    const origin = genOriginId(details.url)
    log.debug('Register new visit', origin.stableUrl, origin.id)
    await reportVisit(storage, origin)
    const transition = _tabTransitionState[details.tabId]
    if (
      transition?.source?.url != null &&
      isRelationTransition(transition, details.url)
    ) {
      log.debug('Register transition (1)', transition.source.url, details.url)
      reportAssociation(storage, transition.source.url, details.url)
    }
    _tabTransitionState[details.tabId] = {
      source: { url: details.url },
    }
  }
}
const onHistoryStateUpdatedListener = async (
  storage: StorageApi,
  details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType
) => {
  if (details.frameId === 0) {
    const transition = _tabTransitionState[details.tabId]
    if (
      transition?.source?.url != null &&
      isRelationTransition(transition, details.url)
    ) {
      log.debug('Register transition (2)', transition.source.url, details.url)
      reportAssociation(storage, transition.source.url, details.url)
    }
    _tabTransitionState[details.tabId] = {
      source: { url: details.url },
    }
  }
}
const onReferenceFragmentUpdatedListener = async (
  storage: StorageApi,
  details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType
) => {
  if (details.frameId === 0) {
    const transition = _tabTransitionState[details.tabId]
    if (
      transition?.source?.url != null &&
      isRelationTransition(transition, details.url)
    ) {
      log.debug(
        'Register transition (3)',
        transition.source.url,
        details.url && transition?.transitionType === 'link'
      )
      reportAssociation(storage, transition.source.url, details.url)
    }
    _tabTransitionState[details.tabId] = {
      source: { url: details.url },
    }
  }
}
const onCreatedNavigationTargetListener = async (
  details: browser.WebNavigation.OnCreatedNavigationTargetDetailsType
) => {
  const prev = await browser.tabs.get(details.sourceTabId)
  const transition = _tabTransitionState[details.tabId]
  if (prev.url != null) {
    if (transition != null) {
      transition.source = { url: prev.url }
    } else {
      _tabTransitionState[details.tabId] = {
        source: { url: prev.url },
      }
    }
  }
}
const onCommittedListener = async (
  details_: browser.WebNavigation.OnCommittedDetailsType
) => {
  if (details_.frameId === 0) {
    // Dirty hack to patch incosistency of browser-polyfill lib
    const details = details_ as browser.WebNavigation.OnCommittedDetailsType & {
      transitionType?: TransitionType
      transitionQualifiers: TransitionQualifier[]
    }
    const transition = _tabTransitionState[details.tabId]
    if (transition != null) {
      // Add information about transition type
      transition.transitionType = details.transitionType
      transition.transitionQualifiers = details.transitionQualifiers
    } else {
      _tabTransitionState[details.tabId] = {
        transitionType: details.transitionType,
        transitionQualifiers: details.transitionQualifiers,
      }
    }
  }
}

const onBeforeNavigateListener = (
  _details: browser.WebNavigation.OnBeforeNavigateDetailsType
) => {}

export function register(storage: StorageApi) {
  const timer = new Timer()
  const onCompletedCb = (
    details: browser.WebNavigation.OnCompletedDetailsType
  ) => onCompletedListener(storage, details)
  if (!browser.webNavigation.onCompleted.hasListener(onCompletedCb)) {
    browser.webNavigation.onCompleted.addListener(onCompletedCb)
  }
  const onHistoryStateUpdatedCb = (
    details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType
  ) => onHistoryStateUpdatedListener(storage, details)
  if (
    !browser.webNavigation.onHistoryStateUpdated.hasListener(
      onHistoryStateUpdatedCb
    )
  ) {
    browser.webNavigation.onHistoryStateUpdated.addListener(
      onHistoryStateUpdatedCb
    )
  }
  const onReferenceFragmentUpdatedCb = (
    details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType
  ) => onReferenceFragmentUpdatedListener(storage, details)
  if (
    !browser.webNavigation.onReferenceFragmentUpdated.hasListener(
      onReferenceFragmentUpdatedCb
    )
  ) {
    browser.webNavigation.onReferenceFragmentUpdated.addListener(
      onReferenceFragmentUpdatedCb
    )
  }
  if (
    !browser.webNavigation.onCreatedNavigationTarget.hasListener(
      onCreatedNavigationTargetListener
    )
  ) {
    browser.webNavigation.onCreatedNavigationTarget.addListener(
      onCreatedNavigationTargetListener
    )
  }
  if (!browser.webNavigation.onCommitted.hasListener(onCommittedListener)) {
    browser.webNavigation.onCommitted.addListener(onCommittedListener)
  }
  if (
    !browser.webNavigation.onBeforeNavigate.hasListener(
      onBeforeNavigateListener
    )
  ) {
    browser.webNavigation.onBeforeNavigate.addListener(onBeforeNavigateListener)
  }
  log.debug('WebNavigation module is loaded', timer.elapsed())
  return () => {
    browser.webNavigation.onCreatedNavigationTarget.removeListener(
      onCreatedNavigationTargetListener
    )
    browser.webNavigation.onReferenceFragmentUpdated.removeListener(
      onReferenceFragmentUpdatedCb
    )
    browser.webNavigation.onHistoryStateUpdated.removeListener(
      onHistoryStateUpdatedCb
    )
    browser.webNavigation.onCompleted.removeListener(onCompletedCb)
    browser.webNavigation.onCommitted.removeListener(onCommittedListener)
    browser.webNavigation.onBeforeNavigate.removeListener(
      onBeforeNavigateListener
    )
  }
}
