import React from 'react'
import lodash from 'lodash'

import type { Nid } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import { errorise, log, productanalytics, sleep } from 'armoury'

import { FromBackground, FromContent } from '../../message/types'
import { extractSimilaritySearchPhraseFromPageContent } from '../extractor/webPageSearchPhrase'
import { ContentContext } from '../context'
import { extractSearchEngineQuery } from '../extractor/url/searchEngineQuery'
import {
  SuggestionsFloater,
  RelevantNodeSuggestion,
} from './SuggestionsFloater'

export function getKeyPhraseFromUserInput(
  target?: HTMLTextAreaElement
): string | null {
  if (target == null) {
    return null
  }
  const value =
    (target as HTMLTextAreaElement).value ??
    target.innerText ??
    target.textContent
  return value ?? null
}

type UserInput = {
  target: HTMLTextAreaElement | null
  phrase: string | null
}
function updateUserInputFromKeyboardEvent(keyboardEvent: KeyboardEvent) {
  if ('altKey' in keyboardEvent) {
    const event =
      keyboardEvent as unknown as React.KeyboardEvent<HTMLTextAreaElement>
    const target = event.target as HTMLTextAreaElement
    if (target.isContentEditable || target.tagName === 'TEXTAREA') {
      const phrase = getKeyPhraseFromUserInput(target)
      return { target, phrase }
    }
  }
  return { target: null, phrase: null }
}

type SimilaritySearchInput = {
  phrase?: string
  isSearchEngine: boolean
}

async function retryIfStillLoading<T>(
  fn: () => Promise<T>,
  { times, intervalMs }: { times: number; intervalMs: number }
): Promise<T> {
  const backgroundIsStillLoading = (error: Error) => {
    return (
      FromBackground.isIncompatibleInitPhase(error) &&
      error.phase.actual === 'loading'
    )
  }

  for (let i = 0; i < times; i++, await sleep(intervalMs)) {
    try {
      return await fn()
    } catch (e) {
      const error = errorise(e)
      // Retry if the background script is still initialising as
      // there is a chance it will be eventually ready.
      // Do not retry on any unknown errors.
      if (!backgroundIsStillLoading(error)) {
        throw e
      }
    }
  }
  return await fn()
}

export function SuggestedRelatives({
  stableUrl,
  excludeNids,
  tabActivationCounter,
}: {
  stableUrl?: string
  excludeNids?: Nid[]
  // A counter to trigger new suggestions search when user gets back to the tab
  tabActivationCounter: number
}) {
  const analytics = React.useContext(ContentContext).analytics
  const [suggestedNodes, setSuggestedNodes] = React.useState<
    RelevantNodeSuggestion[]
  >([])
  const [suggestionsSearchIsActive, setSuggestionsSearchIsActive] =
    React.useState<boolean>(true)
  const pageSimilaritySearchInput = React.useMemo<SimilaritySearchInput>(() => {
    const searchEngineQuery = extractSearchEngineQuery(
      stableUrl ?? document.location.href
    )
    if (searchEngineQuery?.phrase != null) {
      return { phrase: searchEngineQuery.phrase, isSearchEngine: true }
    }
    const baseURL = stableUrl
      ? new URL(stableUrl).origin
      : `${document.location.protocol}//${document.location.host}`
    const phrase =
      extractSimilaritySearchPhraseFromPageContent(document, baseURL) ??
      undefined
    return { phrase, isSearchEngine: false }
  }, [
    /**
     * The dependency guarantees `pageSimilaritySearchInput` regenration on a newopened page,
     * it's important when a new page is opened by the same React App and DOM is
     * not completely reloaded, but just updated. Because of this don't remove
     * this dependency even if you don't want to insert URL into a search phrase.
     */
    stableUrl,
  ])

  const requestSuggestedAssociations = React.useMemo(
    // Using `useMemo` instead of `useCallback` to avoid eslint complains
    // https://kyleshevlin.com/debounce-and-throttle-callbacks-with-react-hooks
    () =>
      lodash.debounce(
        async (phrase: string) => {
          setSuggestionsSearchIsActive(true)
          log.debug(`Look for the following phrase in Mazed ${phrase}`)
          try {
            const response = await retryIfStillLoading(
              async () =>
                FromContent.sendMessage({
                  type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS',
                  limit: 8,
                  phrase,
                  excludeNids,
                }),
              {
                times: 10,
                intervalMs: 500,
              }
            )
            setSuggestedNodes(
              response.suggested.map((item) => {
                return {
                  node: NodeUtil.fromJson(item.node),
                  matchedPiece: item.matchedPiece,
                }
              })
            )
            analytics?.capture('Search suggested associations', {
              'Event type': 'search',
              result_length: response.suggested.length,
              phrase_size: phrase.length,
            })
          } catch (e) {
            // Don't set empty list of suggestions here, keep whateve previously
            // was suggested to show at least something
            productanalytics.error(
              analytics,
              {
                failedTo: 'get content suggestions',
                location: 'floater',
                cause: errorise(e).message,
              },
              { andLog: true }
            )
          }
          setSuggestionsSearchIsActive(false)
        },
        997,
        {}
      ),
    [excludeNids, analytics]
  )
  const [userInput, setUserInput] = React.useState<UserInput>({
    target: null,
    phrase: null,
  })
  const consumeKeyboardEvent = React.useCallback(
    (keyboardEvent: KeyboardEvent) => {
      const newInput = updateUserInputFromKeyboardEvent(keyboardEvent)
      const { phrase } = newInput
      if (phrase != null && phrase.length > 3 && userInput.phrase !== phrase) {
        requestSuggestedAssociations(phrase)
        setUserInput(newInput)
      }
      return newInput
    },
    [userInput, requestSuggestedAssociations]
  )
  React.useEffect(() => {
    const phrase = pageSimilaritySearchInput.phrase
    if (phrase != null && phrase.length > 3) {
      requestSuggestedAssociations(phrase)
    }
  }, [
    pageSimilaritySearchInput,
    requestSuggestedAssociations,
    tabActivationCounter,
  ])
  React.useEffect(() => {
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('keyup', consumeKeyboardEvent, opts)
    return () => {
      window.removeEventListener('keyup', consumeKeyboardEvent, opts)
    }
  }, [consumeKeyboardEvent])
  return (
    <SuggestionsFloater
      nodes={suggestedNodes}
      isLoading={suggestionsSearchIsActive}
      defaultRevelaed={pageSimilaritySearchInput.isSearchEngine}
    />
  )
}
