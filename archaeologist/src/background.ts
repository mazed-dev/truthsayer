import { MessageType, Message } from './message/types'
import * as badge from './badge'
import {
  log,
  isAbortError,
  genOriginId,
  stabiliseUrlForOriginId,
} from 'armoury'

import browser from 'webextension-polyfill'

import { WebPageContent } from './extractor/webPageContent'

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
} from 'smuggler-api'

import { Mime } from 'armoury'

async function getActiveTabId(): Promise<number | null> {
  try {
    const tabs = await browser.tabs.query({
      active: true,
    })
    const tab = tabs.find((tab) => {
      return tab.id && tab.active
    })
    const tabId = tab?.id
    if (tabId != null) {
      return tabId
    }
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
async function requestPageContentToSave() {
  const tabId = await getActiveTabId()
  if (tabId == null) {
    return
  }
  try {
    await browser.tabs.sendMessage(
      tabId,
      Message.create({ type: 'REQUEST_PAGE_TO_SAVE' })
    )
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
  quotes: TNode[],
  bookmark?: TNode,
  tabId?: number,
  unmemorable?: boolean
): Promise<void> {
  const quotesJson = quotes.map((node) => node.toJson())
  // Inform PopUp window of saved bookmark and web quotes
  try {
    await browser.runtime.sendMessage(
      Message.create({
        type: 'SAVED_NODE',
        bookmark: bookmark?.toJson(),
        quotes: quotesJson,
        unmemorable,
      })
    )
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
  const n = quotes.length + (bookmark != null ? 1 : 0)
  await badge.resetText(tabId, n !== 0 ? n.toString() : undefined)
  // Update content augmentation
  if (tabId != null) {
    await browser.tabs.sendMessage(
      tabId,
      Message.create({
        type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION',
        quotes: quotesJson,
      })
    )
  }
}

async function savePage(
  url: string,
  originId: number,
  content?: WebPageContent,
  tabId?: number
) {
  if (content == null) {
    // Page is not memorable
    const unmemorable = true
    await updateContent([], undefined, tabId, unmemorable)
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
    content_type: Mime.TEXT_URI_LIST,
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
  })
  if (resp) {
    const { nid } = resp
    const node = await smuggler.node.get({ nid })
    await updateContent([], node, tabId)
  }
}

async function savePageQuote(
  originId: number,
  { url, path, text }: NodeExtattrsWebQuote,
  lang?: string,
  tabId?: number
) {
  const extattrs: NodeExtattrs = {
    content_type: Mime.TEXT_PLAIN_UTF_8,
    lang: lang || undefined,
    web_quote: { url, path, text },
  }
  const resp = await smuggler.node.create({
    text: makeNodeTextData(),
    ntype: NodeType.WebQuote,
    origin: {
      id: originId,
    },
    extattrs,
  })
  if (resp) {
    const { nid } = resp
    const node = await smuggler.node.get({ nid })
    await updateContent([node], undefined, tabId)
  }
}

async function requestPageSavedStatus(tab?: browser.Tabs.Tab) {
  if (tab == null) {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    tab = tabs.find((tab) => {
      return tab.url && tab.active
    })
  }
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
  await browser.runtime.sendMessage(
    Message.create({ type: 'AUTH_STATUS', status })
  )
}

async function checkOriginIdAndUpdatePageStatus(
  tabId: number | undefined,
  url: string,
  originId?: number
) {
  if (originId == null) {
    const unmemorable = true
    await updateContent([], undefined, tabId, unmemorable)
    return
  }
  const iter = smuggler.node.slice({
    start_time: 0, // since the beginning of time
    bucket_time_size: 366 * 24 * 60 * 60,
    origin: {
      id: originId,
    },
  })
  let bookmark: TNode | undefined = undefined
  let quotes: TNode[] = []
  for (;;) {
    const node = await iter.next()
    if (node == null) {
      break
    }
    const { extattrs } = node
    if (node.isWebBookmark() && extattrs?.web) {
      if (stabiliseUrlForOriginId(extattrs.web.url) === url) {
        bookmark = node
      }
    }
    if (node.isWebQuote() && extattrs?.web_quote) {
      if (stabiliseUrlForOriginId(extattrs.web_quote.url) === url) {
        quotes.push(node)
      }
    }
  }
  await updateContent(quotes, bookmark, tabId)
}

browser.runtime.onMessage.addListener(
  async (message: MessageType, sender: browser.Runtime.MessageSender) => {
    // process is not defined in browsers extensions - use it to set up axios
    const tabId = sender.tab?.id
    switch (message.type) {
      case 'REQUEST_PAGE_TO_SAVE':
        requestPageContentToSave()
        break
      case 'REQUEST_SAVED_NODE':
        await requestPageSavedStatus()
        break
      case 'PAGE_TO_SAVE':
        const { url, content, originId } = message
        await savePage(url, originId, content, tabId)
        break
      case 'REQUEST_AUTH_STATUS':
        await sendAuthStatus()
        break
      case 'SELECTED_WEB_QUOTE':
        {
          const { originId, url, text, path, lang } = message
          await savePageQuote(originId, { url, path, text }, lang, tabId)
        }
        break
      default:
        break
    }
  }
)

browser.tabs.onUpdated.addListener(
  async (
    _tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => {
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
        await browser.tabs.sendMessage(
          tab.id,
          Message.create({
            type: 'REQUEST_SELECTED_WEB_QUOTE',
            text: selectionText,
          })
        )
      } catch (err) {
        if (!isAbortError(err)) {
          log.exception(err)
        }
      }
    }
  }
)
