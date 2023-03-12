import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { NodeUtil } from 'smuggler-api'
import type { Nid, TNode, TNodeJson } from 'smuggler-api'

import { FromContent } from './../../message/types'
import { SuggestionsFloater } from './SuggestionsFloater'
import { exctractPageContent } from '../extractor/webPageContent'
import { ContentContext } from '../context'

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
  excludeNids,
}: {
  stableUrl?: string
  excludeNids?: Nid[]
}) {
  const analytics = React.useContext(ContentContext).analytics
  const [suggestedNodes, setSuggestedNodes] = React.useState<TNode[]>([])
  const [suggestionsSearchIsActive, setSuggestionsSearchIsActive] =
    React.useState<boolean>(true)
  const pageContent = React.useMemo(() => {
    const baseURL = `${document.location.protocol}//${document.location.host}`
    return exctractPageContent(document, baseURL)
  }, [])
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
          analytics?.capture('Search suggested associations', {
            'Event type': 'search',
            result_size: response.suggested.length,
            phrase_size: phrase.length,
          })
        },
        661,
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
    const phrase = [
      pageContent.title,
      pageContent.description,
      ...pageContent.author,
      pageContent.text,
    ]
      .filter((v) => !!v)
      .join('.\n')
    if (phrase.length > 8) {
      requestSuggestedAssociations(phrase)
    }
  }, [pageContent, requestSuggestedAssociations])
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
