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
  ControlledPosition,
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

const kSubParagraphTagNames = {
  B: true,
  DEL: true,
  EM: true,
  FONT: true,
  I: true,
  INS: true,
  MARK: true,
  SMALL: true,
  SPAN: true,
  STRONG: true,
  SUB: true,
  SUP: true,
  A: true,
}

/**
 * Find offset of given element ralative to "BODY" or other root of the document
 */
function calculateFloaterPosition(element: HTMLElement): ControlledPosition {
  const rect = element.getBoundingClientRect()
  return {
    offset: {
      x: rect.left + rect.width,
      y: rect.top + rect.height - 10,
    },
    element,
  }
}

function getLastEditedParagraph(
  selectionAnchorNode: Node,
  selectionAnchorElement: HTMLElement | null,
  target: HTMLElement
): {
  textContent: string
  element: HTMLElement
} {
  let element: HTMLElement
  if (
    selectionAnchorElement != null &&
    target.contains(selectionAnchorElement)
  ) {
    element = selectionAnchorElement
  } else {
    element = target
  }
  while (
    element.nodeName in kSubParagraphTagNames &&
    element.parentElement != null
  ) {
    element = element.parentElement
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return { textContent: element.value, element }
  }
  if (
    element.innerText.indexOf('\n') >= 0 &&
    selectionAnchorNode.nodeValue != null
  ) {
    return {
      textContent: selectionAnchorNode.nodeValue,
      element, // FIXME(Alexander): selectionAnchorElement ?? target,
    }
  }
  return { textContent: element.textContent ?? element.innerText, element }
}

type SimilaritySearchInput = {
  phrase: string
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
  const [controlledPosition, setControlledPosition] =
    React.useState<ControlledPosition | null>(null)
  const pageSimilaritySearchInput = React.useMemo<SimilaritySearchInput | null>(
    () => {
      const searchEngineQuery = extractSearchEngineQuery(
        stableUrl ?? document.location.href
      )
      const phrase = searchEngineQuery?.phrase
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
  const requestSuggestedAssociationsForPhrase = React.useCallback(
    async (phrase: string) => {
      if (phrase == null) {
        return
      }
      setFloaterShown(true)
      if (phrase.length < 4) {
        log.debug('The phrase is too short to look for suggestions', phrase)
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
              failedTo: 'get suggestions',
              location: 'floater',
              cause: error.message,
            },
            { andLog: true }
          )
        }
      }
      setSuggestionsSearchIsActive(false)
    },
    [excludeNids, analytics]
  )
  const requestSuggestedForKeyboardEvent = React.useMemo(
    // Using `useMemo` instead of `useCallback` to avoid eslint complains
    // https://kyleshevlin.com/debounce-and-throttle-callbacks-with-react-hooks
    () =>
      lodash.debounce(
        (
          selectionAnchorNode: Node,
          selectionAnchorElement: HTMLElement | null,
          target: HTMLElement
        ) => {
          const { textContent, element } = getLastEditedParagraph(
            selectionAnchorNode,
            selectionAnchorElement,
            target
          )
          setControlledPosition(calculateFloaterPosition(element))
          if (textContent != null) {
            requestSuggestedAssociationsForPhrase(textContent).catch((reason) =>
              log.error(`Failed to request suggestions: ${reason}`)
            )
          }
        },
        997,
        {}
      ),
    [requestSuggestedAssociationsForPhrase]
  )
  React.useEffect(() => {
    const callback = async () => {
      let phrase: string | undefined = undefined
      if (pageSimilaritySearchInput != null) {
        phrase = pageSimilaritySearchInput.phrase
      } else {
        setFloaterShown(false)
      }
      if (phrase != null) {
        await requestSuggestedAssociationsForPhrase(phrase)
      }
    }
    callback().catch((reason) =>
      log.error(`Failed to request suggestions: ${reason}`)
    )
  }, [pageSimilaritySearchInput, requestSuggestedAssociationsForPhrase])
  React.useEffect(() => {
    const consumeKeyboardEvent = (keyboardEvent: KeyboardEvent) => {
      if ('altKey' in keyboardEvent) {
        const event =
          keyboardEvent as unknown as React.KeyboardEvent<HTMLTextAreaElement>
        const target = event.target as HTMLElement
        if (target.isContentEditable || target.tagName === 'TEXTAREA') {
          const selection = window.getSelection()
          if (selection?.anchorNode != null) {
            requestSuggestedForKeyboardEvent(
              selection.anchorNode,
              selection.anchorNode.parentElement,
              target
            )
          }
        }
      }
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    // We use 'keypress' and not 'keyup' or 'keydown' here specifically to avoid
    // receiving events on hotkeys such as Cmd+a. The goal is to receive only
    // events that might indicate text editing.
    // There is a specific reason why we don't want Cmd+a events here. When user
    // selects all on a page with Cmd+a and we run similarity search against that
    // and then re-render floater text selection gets dropped. The reason, we
    // believe, that is behind it re-rendering the following elements in
    // SuggestionsFloater:
    // <Draggable><DraggableEvent/></Draggable>
    // See more details in SEV thread:
    // https://mazed-dev.slack.com/archives/C056JTRQ15E/p1685650173458069
    window.addEventListener('keypress', consumeKeyboardEvent, opts)
    return () => {
      window.removeEventListener('keypress', consumeKeyboardEvent, opts)
    }
  }, [requestSuggestedForKeyboardEvent])
  React.useEffect(() => {
    // To make sure floater stay at the bottom of last edited paragraph when
    // user scroll the page we add a lightweight listener for a scroll event to
    // recalculate floter position every time user scroll the page.
    //
    // There is no real theory behind the numbers for the debounce arguments,
    // please feel free to change them accordignly to increase responsiveness or
    // reduce jumpiness of the floater.
    const recalculateControlledPosition = lodash.debounce(
      () => {
        const element = controlledPosition?.element
        if (element) {
          setControlledPosition(calculateFloaterPosition(element))
        }
      },
      400,
      { maxWait: 600 }
    )
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('scroll', recalculateControlledPosition, opts)
    return () => {
      window.removeEventListener('scroll', recalculateControlledPosition, opts)
    }
  }, [controlledPosition])
  if (!isFloaterShown) {
    return null
  }
  return (
    <SuggestionsFloater
      nodes={suggestedNodes?.suggestions || []}
      isLoading={suggestionsSearchIsActive}
      defaultRevelaed={pageSimilaritySearchInput?.isSearchEngine ?? false}
      controlledPosition={controlledPosition}
    />
  )
}
