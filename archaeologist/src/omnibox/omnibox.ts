import { smuggler, TNode } from 'smuggler-api'
import { Beagle, TDoc } from 'elementary'
import { mazed } from '../util/mazed'

import browser from 'webextension-polyfill'
import lodash from 'lodash'

import { formatDescription } from './suggestion-item-description'

const lookUpFor = lodash.debounce(
  async (text: string, limit: number): Promise<TNode[]> => {
    const beagle = Beagle.fromString(text)
    const iter = smuggler.node.slice({})
    const results: TNode[] = []
    for (
      let node = await iter.next();
      node != null && results.length < limit;
      node = await iter.next()
    ) {
      if (beagle.searchNode(node) != null) {
        results.push(node)
      }
    }
    return results
  }
)

function getUrlToOpen(text: string): URL {
  try {
    return new URL(text)
  } catch (_) {}
  return mazed.makeSearchUrl(text)
}

const inputEnteredListener = (
  text: string,
  disposition: browser.Omnibox.OnInputEnteredDisposition
) => {
  const url = getUrlToOpen(text).toString()
  if (disposition === 'newForegroundTab') {
    browser.tabs.create({ url, active: true })
  } else if (disposition === 'newBackgroundTab') {
    browser.tabs.create({ url, active: false })
  } else {
    // disposition === 'currentTab'
    browser.tabs.update(undefined, { url })
  }
}

function _truncate(text: string, length?: number): string {
  return lodash.truncate(text, {
    length: length ?? 12,
    omission: '…',
    separator: /./u,
  })
}

const kTitleLengthMax = 128
const kUrlLengthMax = 42
function _truncateUrl(url: string, length?: number): string {
  const u = new URL(url)
  return _truncate([u.hostname, u.pathname].join(''), length ?? kUrlLengthMax)
}

const inputChangedListener = (
  text: string,
  suggest: (suggestResults: browser.Omnibox.SuggestResult[]) => void
) => {
  browser.omnibox.setDefaultSuggestion({
    description: formatDescription(`Search for "${text === '' ? '…' : text}"`),
  })
  // Omnibox suggestions fit in only 10 elements, no need to look for more.
  // 1 + 9: 1 default suggestion and 9 search results
  lookUpFor(text, 9)?.then((nodes) => {
    suggest(
      nodes.map((node) => {
        const { nid } = node
        const url = node.extattrs?.web?.url || node.extattrs?.web_quote?.url
        if (url != null) {
          if (node.isWebQuote()) {
            const title = _truncate(
              node.extattrs?.web_quote?.text || '',
              kTitleLengthMax
            )
            const shortUrl = _truncateUrl(url)
            return {
              content: url,
              description: formatDescription(title, shortUrl),
            }
          }
          if (node.isWebBookmark()) {
            const title = _truncate(
              node.extattrs?.title ?? node.extattrs?.description ?? '',
              kTitleLengthMax
            )
            const shortUrl = _truncateUrl(url)
            return {
              content: url,
              description: formatDescription(title, shortUrl),
            }
          }
        }
        const doc = TDoc.fromNodeTextData(node.getText())
        const title = doc.genTitle(kTitleLengthMax)
        return {
          content: mazed.makeNodeUrl(nid).toString(),
          description: formatDescription(title),
        }
      })
    )
    suggest([])
  })
}

const inputStartedListener = () => {}

const inputCancelledListener = () => {}

export function register() {
  if (!browser.omnibox.onInputEntered.hasListener(inputEnteredListener)) {
    browser.omnibox.onInputEntered.addListener(inputEnteredListener)
  }
  if (!browser.omnibox.onInputChanged.hasListener(inputChangedListener)) {
    browser.omnibox.onInputChanged.addListener(inputChangedListener)
  }
  if (!browser.omnibox.onInputStarted.hasListener(inputStartedListener)) {
    browser.omnibox.onInputStarted.addListener(inputStartedListener)
  }
  if (!browser.omnibox.onInputCancelled.hasListener(inputCancelledListener)) {
    browser.omnibox.onInputCancelled.addListener(inputCancelledListener)
  }
  return () => {
    browser.omnibox.onInputEntered.removeListener(inputEnteredListener)
    browser.omnibox.onInputChanged.removeListener(inputChangedListener)
    browser.omnibox.onInputStarted.removeListener(inputStartedListener)
    browser.omnibox.onInputCancelled.removeListener(inputCancelledListener)
  }
}
