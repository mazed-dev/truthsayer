import browser from 'webextension-polyfill'
import { log, genOriginId, unixtime } from 'armoury'
import { smuggler } from 'smuggler-api'

type TabNavState = {
  url?: string
  /**
   * Source of the transition, if known
   */
  source?: {
    url: string
  }
}
const _tabNavState: Record<number, TabNavState | undefined> = {}

export function register() {
  browser.webNavigation.onBeforeNavigate.addListener(
    (details: browser.WebNavigation.OnBeforeNavigateDetailsType) => {
      if (details.frameId === 0) {
        const state = _tabNavState[details.tabId]
        log.debug('onBeforeNavigate', details, state)
        if (state != null && state.source?.url != null) {
          // Update page url with every redirect preserving source URL, to
          // report transition correctly
          state.url = details.url
        }
      }
    }
  )
  browser.webNavigation.onCompleted.addListener(
    async (details: browser.WebNavigation.OnCompletedDetailsType) => {
      if (details.frameId === 0) {
        log.debug('onCompleted', details)
        const origin = genOriginId(details.url)
        log.debug('Register new visit', origin.stableUrl, origin.id)
        await smuggler.activity.external.add({ id: origin.id }, [
          { timestamp: unixtime.now() },
        ])
        const state = _tabNavState[details.tabId]
        if (state?.source != null) {
          log.debug('Register transition o--->', state.source.url, details.url)
          smuggler.activity.relation.add({
            from: genOriginId(state.source.url),
            to: genOriginId(details.url),
          })
        }
        if (state?.url != null && state?.url !== details.url) {
          log.debug('Register transition o--->', state.url, details.url)
          smuggler.activity.relation.add({
            from: genOriginId(state.url),
            to: genOriginId(details.url),
          })
        }
        _tabNavState[details.tabId] = { url: details.url }
      }
    }
  )
  browser.webNavigation.onHistoryStateUpdated.addListener(
    async (details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType) => {
      if (details.frameId === 0) {
        log.debug('onHistoryStateUpdated', details)
        const state = _tabNavState[details.tabId]
        if (state?.url != null) {
          log.debug('Register transition o--->', state.url, details.url)
          smuggler.activity.relation.add({
            from: genOriginId(state.url),
            to: genOriginId(details.url),
          })
        }
        _tabNavState[details.tabId] = { url: details.url }
      }
    }
  )
  browser.webNavigation.onReferenceFragmentUpdated.addListener(
    async (
      details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType
    ) => {
      if (details.frameId === 0) {
        log.debug('onReferenceFragmentUpdated', details)
        const state = _tabNavState[details.tabId]
        if (state?.url != null) {
          log.debug('Report transition o--->', state.url, details.url)
          smuggler.activity.relation.add({
            from: genOriginId(state.url),
            to: genOriginId(details.url),
          })
        }
        _tabNavState[details.tabId] = { url: details.url }
      }
    }
  )
  browser.webNavigation.onCreatedNavigationTarget.addListener(
    async (
      details: browser.WebNavigation.OnCreatedNavigationTargetDetailsType
    ) => {
      const prev = await browser.tabs.get(details.sourceTabId)
      log.debug('onCreatedNavigationTarget', details, prev.url)
      if (prev.url != null) {
        _tabNavState[details.tabId] = {
          url: details.url,
          source: { url: prev.url },
        }
      }
    }
  )
  log.debug('WebNavigation listeners are registered')
}
