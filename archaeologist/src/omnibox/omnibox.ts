import { smuggler, TNode } from 'smuggler-api'
import { Beagle, TDoc } from 'elementary'
import { mazed } from '../util/mazed'

import browser from 'webextension-polyfill'
import lodash from 'lodash'

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
  console.log('Mazed omnibox inputEnteredListener', text, disposition, url)
  if (disposition === 'newForegroundTab') {
    browser.tabs.create({ url, active: true })
  } else if (disposition === 'newBackgroundTab') {
    browser.tabs.create({ url, active: false })
  } else {
    // disposition === 'currentTab'
    browser.tabs.update(undefined, { url })
  }
}

function shortenBy(text: string, limit?: number): string {
  limit = limit ?? 12
  if (text.length > limit) {
    return `${text.slice(0, limit - 1)}…`
  }
  return text
}

function shortenUrlBy(url: string, limit?: number): string {
  const u = new URL(url)
  return shortenBy([u.hostname, u.pathname].join(''), limit)
}

const inputChangedListener = (
  text: string,
  suggest: (suggestResults: browser.Omnibox.SuggestResult[]) => void
) => {
  console.log('Mazed omnibox inputChangedListener', text, suggest)
  browser.omnibox.setDefaultSuggestion({
    description: `Search <match>${text}</match> - <dim>Mazed</dim>`,
  })
  lookUpFor(text, 12)?.then((nodes) => {
    suggest(
      nodes.map((node) => {
        const { nid } = node
        const url = node.extattrs?.web?.url || node.extattrs?.web_quote?.url
        if (url != null) {
          if (node.isWebQuote()) {
            const title = shortenBy(node.extattrs?.web_quote?.text || '', 32)
            const shortUrl = shortenUrlBy(url, 19)
            return {
              content: url,
              description: `"<match>${title}</match>" <dim>${shortUrl}</dim> - <dim>Mazed</dim>`,
            }
          }
          if (node.isWebBookmark()) {
            const title = shortenBy(
              node.extattrs?.title ?? node.extattrs?.description ?? '',
              32
            )
            const shortUrl = shortenUrlBy(url, 19)
            return {
              content: url,
              description: `<match>"${title}"</match> <dim>${shortUrl}</dim> - <dim>Mazed</dim>`,
            }
          }
        }
        const doc = TDoc.fromNodeTextData(node.getText())
        const title = doc.genTitle()
        return {
          content: mazed.makeNodeUrl(nid).toString(),
          description: `<match>"${title}"</match> - <dim>Mazed</dim>`,
        }
      })
    )
    suggest([])
  })
}

const inputStartedListener = () => {
  console.log('Mazed omnibox inputStartedListener')
}

const inputCancelledListener = () => {
  console.log('Mazed omnibox inputCancelledListener')
}

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
