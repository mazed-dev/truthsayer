import { DisappearingToastProps } from '../content/toaster/Toaster'
import { WebPageContent } from '../content/extractor/webPageContent'
import { extractSearchEngineQuery } from '../content/extractor/url/searchEngineQuery'

import { log, isAbortError, MimeType, errorise, genOriginId } from 'armoury'
import {
  Nid,
  NodeCreatedVia,
  NodeExtattrs,
  NodeExtattrsWebQuote,
  NodeIndexText,
  NodeType,
  OriginHash,
  TNode,
  makeNodeTextData,
  smuggler,
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

async function _getOriginRelationNids(
  nids: Nid[],
  url?: string
): Promise<Nid[]> {
  if (nids) {
    return nids
  } else if (url != null) {
    const query = extractSearchEngineQuery(url)
    if (query != null) {
      const { nid } = await _saveWebSearchQuery(
        url,
        [],
        [],
        query.phrase,
        query.logo
      )
      return [nid]
    }
  }
  return []
}

export async function saveWebPage(
  url: string,
  originId: OriginHash,
  toNids: string[],
  fromNids: string[],
  createdVia: NodeCreatedVia,
  content?: WebPageContent,
  tabId?: number
): Promise<{ node?: TNode; unmemorable: boolean }> {
  const searchEngineQuery = extractSearchEngineQuery(url)
  if (searchEngineQuery != null) {
    const node = await _saveWebSearchQuery(
      url,
      toNids,
      fromNids,
      searchEngineQuery.phrase,
      searchEngineQuery.logo,
      originId
    )
    return { node, unmemorable: false }
  }
  if (content == null) {
    // Update badge counter
    await badge.setStatus(tabId, ACTION_DONE_BADGE_MARKER)
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
  const originTransitions = await smuggler.activity.association.get({
    origin: { id: originId },
  })
  log.debug('Gather transitions', originTransitions)
  for (const association of originTransitions.to) {
    if ('web_transition' in association.association) {
      const nids = await _getOriginRelationNids(
        association.to.nids,
        association.association.web_transition.to_url
      )
      if (nids) {
        toNids.push(...nids)
      }
    }
  }
  for (const association of originTransitions.from) {
    if ('web_transition' in association.association) {
      const nids = await _getOriginRelationNids(
        association.from.nids,
        association.association.web_transition.from_url
      )
      if (nids) {
        fromNids.push(...nids)
      }
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
    created_via: createdVia,
  })

  // Update badge counter
  await badge.setStatus(tabId, ACTION_DONE_BADGE_MARKER)

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
  createdVia: NodeCreatedVia,
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
    created_via: createdVia,
  })
  if (resp) {
    // Update badge counter
    await badge.setStatus(tabId, ACTION_DONE_BADGE_MARKER)

    const { nid } = resp
    const node = await smuggler.node.get({ nid })
    await updateContent([node], undefined, tabId)
  }
}

async function _saveWebSearchQuery(
  url: string,
  toNids: string[],
  fromNids: string[],
  phrase?: string,
  icon?: string,
  originId?: OriginHash
): Promise<TNode> {
  if (originId == null) {
    originId = genOriginId(url).id
  }
  const text = makeNodeTextData()
  const index_text: NodeIndexText = {
    labels: [],
    brands: [],
    dominant_colors: [],
  }
  const extattrs: NodeExtattrs = {
    content_type: MimeType.TEXT_URI_LIST,
    title: phrase,
    preview_image: icon ? { data: icon } : undefined,
    web: { url },
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
  const { nid } = resp
  const node = await smuggler.node.get({ nid })
  return node
}
