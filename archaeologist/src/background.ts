import * as badge from './badge/badge'
import * as omnibox from './omnibox/omnibox'
import { ToPopUp, ToContent, FromPopUp, FromContent } from './message/types'
import { mazed } from './util/mazed'
import { DisappearingToastProps } from './content/toaster/Toaster'

import { WebPageContent } from './content/extractor/webPageContent'

import browser from 'webextension-polyfill'
import { log, isAbortError, errorise, genOriginId, MimeType } from 'armoury'
import {
  Knocker,
  NodeExtattrs,
  NodeExtattrsWebQuote,
  NodeIndexText,
  NodeType,
  TNode,
  authCookie,
  makeNodeTextData,
  smuggler,
  OriginHash,
} from 'smuggler-api'

async function getActiveTab(): Promise<browser.Tabs.Tab | null> {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    const tab = tabs.find((tab) => {
      return tab.id && tab.url && tab.active
    })
    return tab || null
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
  return null
}

/**
 * Request page to be saved. content.ts is listening for this message and
 * respond with page content message that could be saved to smuggler.
 */
async function requestPageContentToSave(tab: browser.Tabs.Tab | null) {
  const tabId = tab?.id
  if (tabId == null) {
    return
  }
  try {
    await ToContent.sendMessage(tabId, { type: 'REQUEST_PAGE_CONTENT' })
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
}

/**
 * Update content (saved nodes) in:
 *   - Pop up window.
 *   - Content augmentation.
 *   - Badge counter.
 */
async function updateContent(
  mode: 'append' | 'reset',
  quotes: TNode[],
  bookmark?: TNode,
  tabId?: number,
  unmemorable?: boolean
): Promise<void> {
  const quotesJson = quotes.map((node) => node.toJson())
  const bookmarkJson = bookmark?.toJson()
  // Inform PopUp window of saved bookmark and web quotes
  try {
    await ToPopUp.sendMessage({
      type: 'UPDATE_POPUP_CARDS',
      bookmark: bookmarkJson,
      quotes: quotesJson,
      unmemorable,
      mode,
    })
  } catch (err) {
    if (isAbortError(err)) {
      return
    }
    log.debug(
      'Sending message to pop up window failed, the window might not exist',
      err
    )
  }
  // Update badge counter
  let badgeText: string | undefined = '✓'
  if (mode === 'reset') {
    const n = quotes.length + (bookmark != null ? 1 : 0)
    if (n !== 0) {
      badgeText = n.toString()
    } else {
      badgeText = undefined
    }
  }
  await badge.resetText(tabId, badgeText)
  // Update content augmentation
  if (tabId == null) {
    return
  }
  try {
    await ToContent.sendMessage(tabId, {
      type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION',
      quotes: quotesJson,
      bookmark: bookmarkJson,
      mode,
    })
  } catch (exception) {
    const error = errorise(exception)
    if (isAbortError(error)) {
      return
    }
    if (error.message.search(/receiving end does not exist/i) >= 0) {
      log.debug(
        'Can not send augmentation to the current tab, content script is not listening',
        error
      )
      return
    }
    log.exception(error, 'Content augmentation sending failed')
  }
}

async function savePage(
  url: string,
  originId: OriginHash,
  quoteNids: string[],
  content?: WebPageContent,
  tabId?: number
) {
  if (content == null) {
    // Page is not memorable
    const unmemorable = true
    await updateContent('append', [], undefined, tabId, unmemorable)
    return
  }
  const text = makeNodeTextData()
  const index_text: NodeIndexText = {
    plaintext: content.text || undefined,
    labels: [],
    brands: [],
    dominant_colors: [],
  }
  const extattrs: NodeExtattrs = {
    content_type: MimeType.TEXT_URI_LIST,
    preview_image: content.image || undefined,
    title: content.title || undefined,
    description: content.description || undefined,
    lang: content.lang || undefined,
    author: content.author.join(', '),
    web: {
      url: url,
    },
    blob: undefined,
  }
  const resp = await smuggler.node.create({
    text,
    index_text,
    extattrs,
    ntype: NodeType.Url,
    origin: {
      id: originId,
    },
    to_nid: quoteNids,
  })
  const { nid } = resp
  const node = await smuggler.node.get({ nid })
  await updateContent('append', [], node, tabId)
  await showDisappearingNotification(tabId, {
    text: 'Added',
    tooltip: 'Page is added to your timeline',
    href: mazed.makeNodeUrl(nid).toString(),
  })
}

async function savePageQuote(
  originId: OriginHash,
  { url, path, text }: NodeExtattrsWebQuote,
  lang?: string,
  tabId?: number,
  fromNid?: string
) {
  const extattrs: NodeExtattrs = {
    content_type: MimeType.TEXT_PLAIN_UTF_8,
    lang: lang || undefined,
    web_quote: { url, path, text },
  }
  const resp = await smuggler.node.create({
    text: makeNodeTextData(),
    ntype: NodeType.WebQuote,
    origin: {
      id: originId,
    },
    from_nid: fromNid ? [fromNid] : undefined,
    extattrs,
  })
  if (resp) {
    const { nid } = resp
    const node = await smuggler.node.get({ nid })
    await updateContent('append', [node], undefined, tabId)
  }
}

async function showDisappearingNotification(
  tabId: number | undefined,
  notification: DisappearingToastProps
) {
  if (tabId == null) {
    return
  }
  try {
    await ToContent.sendMessage(tabId, {
      type: 'SHOW_DISAPPEARING_NOTIFICATION',
      ...notification,
    })
  } catch (err) {
    if (isAbortError(err)) {
      return
    }
    log.debug(
      'Request to show disappearing notification in the tab failed',
      err
    )
  }
}

async function requestPageSavedStatus(tab: browser.Tabs.Tab | null) {
  if (tab == null) {
    return
  }
  const { id, url } = tab
  if (url == null) {
    return
  }
  const { id: originId, stableUrl } = await genOriginId(url)
  await checkOriginIdAndUpdatePageStatus(id, stableUrl, originId)
}

// Periodically renew auth token using Knocker
//
// Time period in milliseonds (~17 minutes) is a magic prime number to avoid too
// many weird correlations with running Knocker in web app.
const _kRenewTokenTimePeriodInSeconds = 1062599
const _authKnocker = new Knocker(_kRenewTokenTimePeriodInSeconds)
_authKnocker.start()

async function sendAuthStatus() {
  const cookie = await browser.cookies
    .get({
      url: authCookie.url,
      name: authCookie.name,
    })
    .catch((err) => {
      if (!isAbortError(err)) {
        log.exception(err)
      }
      return null
    })
  const status = authCookie.checkRawValue(cookie?.value || null)
  badge.setActive(status)

  try {
    await ToPopUp.sendMessage({ type: 'AUTH_STATUS', status })
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err, 'Could not send auth status')
    }
  }
}

async function checkOriginIdAndUpdatePageStatus(
  tabId: number | undefined,
  url: string,
  originId?: OriginHash
) {
  if (originId == null) {
    const unmemorable = true
    await updateContent('reset', [], undefined, tabId, unmemorable)
    return
  }
  let nodes
  try {
    nodes = await smuggler.node.lookup({ url })
  } catch (err) {
    log.debug('Lookup by origin ID failed, consider page as non saved', err)
    return
  }
  let bookmark: TNode | undefined = undefined
  let quotes: TNode[] = []
  for (const node of nodes) {
    if (node.isWebBookmark()) {
      bookmark = node
    } else if (node.isWebQuote()) {
      quotes.push(node)
    }
  }
  await updateContent('reset', quotes, bookmark, tabId)
}

browser.runtime.onMessage.addListener(
  async (
    message: FromContent.Message,
    sender: browser.Runtime.MessageSender
  ) => {
    const tab = sender.tab ?? (await getActiveTab())
    switch (message.type) {
      case 'PAGE_TO_SAVE':
        const { url, content, originId, quoteNids } = message
        await savePage(url, originId, quoteNids, content, tab?.id)
        break
      case 'SELECTED_WEB_QUOTE':
        {
          const { originId, url, text, path, lang, fromNid } = message
          await savePageQuote(
            originId,
            { url, path, text },
            lang,
            tab?.id,
            fromNid
          )
        }
        break
      default:
        break
    }
  }
)

browser.runtime.onMessage.addListener(async (message: FromPopUp.Message) => {
  // process is not defined in browsers extensions - use it to set up axios
  const activeTab = await getActiveTab()
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      requestPageContentToSave(activeTab)
      break
    case 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS':
      await requestPageSavedStatus(activeTab)
      break
    case 'REQUEST_AUTH_STATUS':
      await sendAuthStatus()
      break
    default:
      break
  }
})

browser.tabs.onUpdated.addListener(
  async (
    _tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => {
    log.debug('background. try to requestPageSavedStatus', tab)
    if (
      !tab.incognito &&
      tab.url &&
      !tab.hidden &&
      changeInfo.status === 'complete'
    ) {
      // Request page saved status on new non-incognito page loading
      await requestPageSavedStatus(tab)
    }
  }
)

browser.cookies.onChanged.addListener(async (info) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.name) {
    const status = authCookie.checkRawValue(value || null)
    await badge.setActive(status)
    if (status) {
      _authKnocker.start()
    } else {
      _authKnocker.abort()
    }
  }
})

const kMazedContextMenuItemId = 'selection-to-mazed-context-menu-item'
browser.contextMenus.removeAll()
browser.contextMenus.create({
  title: 'Save to Mazed',
  type: 'normal',
  id: kMazedContextMenuItemId,
  contexts: ['selection', 'editable'],
})

browser.contextMenus.onClicked.addListener(
  async (
    info: browser.Menus.OnClickData,
    tab: browser.Tabs.Tab | undefined
  ) => {
    if (info.menuItemId === kMazedContextMenuItemId) {
      if (tab?.id == null) {
        return
      }
      const { selectionText } = info
      if (selectionText == null) {
        return
      }
      try {
        await ToContent.sendMessage(tab.id, {
          type: 'REQUEST_SELECTED_WEB_QUOTE',
          text: selectionText,
        })
      } catch (err) {
        if (!isAbortError(err)) {
          log.exception(err)
        }
      }
    }
  }
)

omnibox.register()
