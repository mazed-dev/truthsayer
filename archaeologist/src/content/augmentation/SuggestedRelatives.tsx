import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { NodeUtil } from 'smuggler-api'
import type { Nid, TNode, TNodeJson } from 'smuggler-api'

import { FromContent } from './../../message/types'
import { SuggestionsFloater } from './SuggestionsFloater'
import { exctractPageContent } from '../extractor/webPageContent'

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

export function SuggestedRelatives({
  stableUrl,
  excludeNids,
}: {
  stableUrl?: string
  excludeNids?: Nid[]
}) {
  log.debug('SuggestedRelatives', stableUrl)
  const [suggestedNodes, setSuggestedNodes] = React.useState<TNode[]>([])
  const [suggestionsSearchIsActive, setSuggestionsSearchIsActive] =
    React.useState<boolean>(true)
  const pagePhrase = React.useMemo(() => {
    const baseURL = `${document.location.protocol}//${document.location.host}`
    const pageContent = exctractPageContent(document, baseURL)
    const phrase = [
      pageContent.title,
      pageContent.description,
      ...pageContent.author,
      pageContent.text,
      ...(stableUrl?.split('/') ?? []),
    ]
      .filter((v) => !!v)
      .join('.\n')
    return phrase
  }, [
    /**
     * The dependency guarantees `pagePhrase` regenration on a newopened page,
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
          log.debug(`Look for "${phrase}" in Mazed`)
          const response = await FromContent.sendMessage({
            type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS',
            limit: 8,
            phrase,
            excludeNids,
          })
          setSuggestedNodes(
            response.suggested.map((value: TNodeJson) =>
              NodeUtil.fromJson(value)
            )
          )
          setSuggestionsSearchIsActive(false)
        },
        661,
        {}
      ),
    [excludeNids]
  )
  const [userInput, setUserInput] = React.useState<UserInput>({
    target: null,
    phrase: null,
  })
  const consumeKeyboardEvent = React.useCallback(
    (keyboardEvent: KeyboardEvent) => {
      const newInput = updateUserInputFromKeyboardEvent(keyboardEvent)
      const { phrase } = newInput
      log.debug('consumeKeyboardEvent', phrase, userInput)
      if (phrase != null && phrase.length > 3 && userInput.phrase !== phrase) {
        requestSuggestedAssociations(phrase)
        setUserInput(newInput)
      } else if (phrase == null && pagePhrase.length > 8) {
        requestSuggestedAssociations(pagePhrase)
      }
      return newInput
    },
    [userInput, requestSuggestedAssociations, pagePhrase]
  )
  React.useEffect(() => {
    if (pagePhrase.length > 8) {
      requestSuggestedAssociations(pagePhrase)
    }
  }, [pagePhrase, requestSuggestedAssociations])
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
    />
  )
}
