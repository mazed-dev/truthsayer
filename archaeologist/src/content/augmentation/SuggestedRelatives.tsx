import React from 'react'
import lodash from 'lodash'

import type { Nid } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import { errorise, log, productanalytics, sleep, isAbortError } from 'armoury'

import { FromBackground, FromContent } from '../../message/types'
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
  target: HTMLTextAreaElement
  phrase: string
}
function updateUserInputFromKeyboardEvent(
  keyboardEvent: KeyboardEvent
): UserInput | null {
  if ('altKey' in keyboardEvent) {
    const event =
      keyboardEvent as unknown as React.KeyboardEvent<HTMLTextAreaElement>
    const target = event.target as HTMLTextAreaElement
    if (target.isContentEditable || target.tagName === 'TEXTAREA') {
      const phrase = getKeyPhraseFromUserInput(target)
      if (phrase != null) {
        return { target, phrase }
      }
    }
  }
  return null
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

type ReceivedSuggestions = {
  phrase: string
  suggestions: RelevantNodeSuggestion[]
}

export function SuggestedRelatives({
  stableUrl,
  excludeNids,
  tabTitleUpdateCounter,
}: {
  stableUrl?: string
  excludeNids?: Nid[]
  tabTitleUpdateCounter: number
}) {
  const analytics = React.useContext(ContentContext).analytics
  // Empty list of suggestions is a signal to render floater with no suggestinos
  // Null-suggestions means floater should not be rendered at all.
  const [suggestedNodes, setSuggestedNodes] =
    React.useState<ReceivedSuggestions | null>(null)
  const [suggestionsSearchIsActive, setSuggestionsSearchIsActive] =
    React.useState<boolean>(true)
  const pageSimilaritySearchInput = React.useMemo<SimilaritySearchInput | null>(
    () => {
      const searchEngineQuery = extractSearchEngineQuery(
        stableUrl ?? document.location.href
      )
      let phrase = searchEngineQuery?.phrase
      if (phrase != null) {
        return { phrase, isSearchEngine: true }
      }
      return null
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      /**
       * The dependency on stableUrl guarantees `pageSimilaritySearchInput`
       * regenration on a newopened page, it's important when a new page is
       * opened by the same React App and DOM is not completely reloaded, but just
       * updated. Because of this don't remove this dependency even if you don't
       * want to insert URL into a search phrase.
       */
      stableUrl,
      /**
       * The dependency on title update conuter guarantees regenration of search
       * phrase every time when page changes it's title. Changed title with a very
       * hight probability means changed content by page JS.
       */
      tabTitleUpdateCounter,
    ]
  )

  const requestSuggestedAssociationsForPhrase = React.useMemo(
    // Using `useMemo` instead of `useCallback` to avoid eslint complains
    // https://kyleshevlin.com/debounce-and-throttle-callbacks-with-react-hooks
    () =>
      lodash.debounce(
        async (phrase: string) => {
          setSuggestionsSearchIsActive(true)
          log.debug('Look for the following phrase in Mazed ->', phrase)
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
            setSuggestedNodes({
              phrase,
              suggestions: response.suggested.map((item) => {
                return { ...item, node: NodeUtil.fromJson(item.node) }
              }),
            })
            analytics?.capture('Search suggested associations', {
              'Event type': 'search',
              result_length: response.suggested.length,
              phrase_size: phrase.length,
            })
          } catch (e) {
            // Don't set empty list of suggestions here, keep whateve previously
            // was suggested to show at least something
            const error = errorise(e)
            if (!isAbortError(error)) {
              productanalytics.error(
                analytics ?? null,
                {
                  failedTo: 'get content suggestions',
                  location: 'floater',
                  cause: error.message,
                },
                { andLog: true }
              )
            }
          }
          setSuggestionsSearchIsActive(false)
        },
        997,
        {}
      ),
    [excludeNids, analytics]
  )
  const [userInput, setUserInput] = React.useState<UserInput | null>(null)
  const requestSuggestedAssociations = () => {
    if (userInput != null) {
      const { phrase } = userInput
      if (phrase.length > 5 && phrase !== suggestedNodes?.phrase) {
        requestSuggestedAssociationsForPhrase(phrase)
      }
      return
    }
    if (pageSimilaritySearchInput != null) {
      const { phrase } = pageSimilaritySearchInput
      if (phrase != null && phrase.length > 5) {
        if (phrase !== suggestedNodes?.phrase) {
          requestSuggestedAssociationsForPhrase(phrase)
        }
        return
      }
    }
    // Just hide the floater otherwise
    setSuggestedNodes(null)
  }
  React.useEffect(requestSuggestedAssociations, [
    pageSimilaritySearchInput,
    requestSuggestedAssociationsForPhrase,
    userInput,
    suggestedNodes?.phrase,
  ])
  React.useEffect(() => {
    const consumeKeyboardEvent = (keyboardEvent: KeyboardEvent) => {
      const newInput = updateUserInputFromKeyboardEvent(keyboardEvent)
      setUserInput(newInput)
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('keyup', consumeKeyboardEvent, opts)
    return () => {
      window.removeEventListener('keyup', consumeKeyboardEvent, opts)
    }
  }, [])
  if (suggestedNodes == null) {
    return null
  }
  return (
    <SuggestionsFloater
      nodes={suggestedNodes.suggestions}
      isLoading={suggestionsSearchIsActive}
      defaultRevelaed={pageSimilaritySearchInput?.isSearchEngine ?? false}
      reloadSuggestions={requestSuggestedAssociations}
    />
  )
}
