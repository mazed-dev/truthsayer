import React from 'react'
import lodash from 'lodash'

import type { Nid } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import { errorise, log, productanalytics, sleep, isAbortError } from 'armoury'

import { FromBackground, FromContent } from '../../message/types'
import { ContentContext } from '../context'
import { extractSearchEngineQuery } from '../extractor/url/searchEngineQuery'
import { getLastEditedParagrph } from '../extractor/getLastEditedParagraph'
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
  textContent: string
  // Preserve previous text content of user input to be able to extract last
  // edited paragraph by comparing 2 versions
  prevTextContent?: string
}
function updateUserInputFromKeyboardEvent(
  keyboardEvent: KeyboardEvent,
  prevUserInput: UserInput | null
): UserInput | null {
  if ('altKey' in keyboardEvent) {
    const event =
      keyboardEvent as unknown as React.KeyboardEvent<HTMLTextAreaElement>
    const target = event.target as HTMLTextAreaElement
    log.debug(event)
    if (target.isContentEditable || target.tagName === 'TEXTAREA') {
      const selection = window.getSelection()
      log.debug('Selection: ', selection)
      if (selection) {
        let element = selection.anchorNode?.parentElement
        let prev = element
        while (element != null) {
          if (target.isSameNode(element)) {
            break
          }
          if (element?.nodeName === 'P') {
            break
          }
          const text = element.innerText ?? element.textContent ?? ''
          log.debug('Element', element)
          log.debug('Text', text)
          if (text?.indexOf('\n') >= 0) {
            element = prev
            break
          }
          prev = element
          element = element.parentElement
        }
        log.debug('Found', element?.innerText ?? element?.textContent, element)
      }
      const textContent = getKeyPhraseFromUserInput(target)
      if (textContent != null) {
        return {
          target,
          textContent,
          prevTextContent: prevUserInput?.textContent,
        }
      }
    }
  }
  return null
}

type SimilaritySearchInput = {
  textContent: string
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
  // Text that was used to search for relatives
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
  const [isFloaterShown, setFloaterShown] = React.useState<boolean>(true)
  const [suggestionsSearchIsActive, setSuggestionsSearchIsActive] =
    React.useState<boolean>(true)
  const pageSimilaritySearchInput = React.useMemo<SimilaritySearchInput | null>(
    () => {
      const searchEngineQuery = extractSearchEngineQuery(
        stableUrl ?? document.location.href
      )
      const textContent = searchEngineQuery?.phrase
      if (textContent != null) {
        return { textContent, isSearchEngine: true }
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
        async (textContent: string, previousTextContent?: string) => {
          setFloaterShown(true)
          const phrase = getLastEditedParagrph(textContent, previousTextContent)
          if (phrase == null) {
            return
          }
          setSuggestionsSearchIsActive(true)
          log.debug(`Look for suggestions using phrase: "${phrase}"`)
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
  const requestSuggestedAssociations = React.useCallback(() => {
    const callback = async () => {
      let textContent: string | undefined = undefined
      let prevTextContent: string | undefined = undefined
      if (userInput != null) {
        textContent = userInput.textContent
        prevTextContent = userInput.prevTextContent
      } else if (pageSimilaritySearchInput != null) {
        textContent = pageSimilaritySearchInput.textContent
      } else {
        setFloaterShown(false)
      }
      if (textContent != null) {
        await requestSuggestedAssociationsForPhrase(
          textContent,
          prevTextContent
        )
      }
    }
    callback().catch((reason) =>
      log.error(`Failed to request suggestions: ${reason}`)
    )
  }, [
    pageSimilaritySearchInput,
    requestSuggestedAssociationsForPhrase,
    userInput,
  ])
  React.useEffect(requestSuggestedAssociations, [requestSuggestedAssociations])
  React.useEffect(() => {
    const consumeKeyboardEvent = (keyboardEvent: KeyboardEvent) => {
      setUserInput((userInput) =>
        updateUserInputFromKeyboardEvent(keyboardEvent, userInput)
      )
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('keyup', consumeKeyboardEvent, opts)
    return () => {
      window.removeEventListener('keyup', consumeKeyboardEvent, opts)
    }
  }, [])
  if (!isFloaterShown) {
    return null
  }
  return (
    <SuggestionsFloater
      nodes={suggestedNodes?.suggestions || []}
      isLoading={suggestionsSearchIsActive}
      defaultRevelaed={pageSimilaritySearchInput?.isSearchEngine ?? false}
      reloadSuggestions={requestSuggestedAssociations}
    />
  )
}
