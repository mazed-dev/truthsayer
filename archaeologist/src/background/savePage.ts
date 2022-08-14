import { DisappearingToastProps } from '../content/toaster/Toaster'
import { WebPageContent } from '../content/extractor/webPageContent'

import { log, isAbortError, MimeType, errorise } from 'armoury'
import {
  NodeExtattrs,
  NodeExtattrsWebQuote,
  NodeIndexText,
  NodeType,
  makeNodeTextData,
  smuggler,
  OriginHash,
  TNode,
} from 'smuggler-api'
import { ToContent } from '../message/types'
import { mazed } from '../util/mazed'
import * as badge from '../badge/badge'

const ACTION_DONE_BADGE_MARKER = '✓'

/**
 * Update content (saved nodes) in:
 *   - Pop up window.
 *   - Content augmentation.
 *   - Badge counter.
 */
async function updateContent(
  quotes: TNode[],
  bookmark?: TNode,
  tabId?: number
): Promise<void> {
  const quotesJson = quotes.map((node) => node.toJson())
  const bookmarkJson = bookmark?.toJson()
  // Update content augmentation
  if (tabId == null) {
    return
  }
  try {
    await ToContent.sendMessage(tabId, {
      type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION',
      quotes: quotesJson,
      bookmark: bookmarkJson,
      mode: 'append',
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

export async function saveWebPage(
  url: string,
  originId: OriginHash,
  toNids: string[],
  fromNids: string[],
  content?: WebPageContent,
  tabId?: number
): Promise<{ node?: TNode; unmemorable: boolean }> {
  if (content == null) {
    // Update badge counter
    await badge.resetText(tabId, ACTION_DONE_BADGE_MARKER)
    // Page is not memorable
    await updateContent([], undefined, tabId)
    return { unmemorable: true }
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
  const originRelations = await smuggler.activity.relation.get({
    origin: { id: originId },
  })
  log.debug('Gather relations', originRelations)
  for (const relation of originRelations.to) {
    const { nid } = relation
    if (nid != null) {
      toNids.push(nid)
    }
  }
  for (const relation of originRelations.from) {
    const { nid } = relation
    if (nid != null) {
      fromNids.push(nid)
    }
  }
  const resp = await smuggler.node.create({
    text,
    index_text,
    extattrs,
    ntype: NodeType.Url,
    origin: {
      id: originId,
    },
    to_nid: toNids,
    from_nid: fromNids,
  })

  // Update badge counter
  await badge.resetText(tabId, ACTION_DONE_BADGE_MARKER)

  const { nid } = resp
  const node = await smuggler.node.get({ nid })
  await updateContent([], node, tabId)
  await showDisappearingNotification(tabId, {
    text: 'Added',
    tooltip: 'Page is added to your timeline',
    href: mazed.makeNodeUrl(nid).toString(),
  })
  return { node, unmemorable: false }
}

export async function savePageQuote(
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
    // Update badge counter
    await badge.resetText(tabId, ACTION_DONE_BADGE_MARKER)

    const { nid } = resp
    const node = await smuggler.node.get({ nid })
    await updateContent([node], undefined, tabId)
  }
}
