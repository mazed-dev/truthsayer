import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { NodeUtil } from 'smuggler-api'
import type { TNode, TNodeJson } from 'smuggler-api'

import { FromContent } from './../../message/types'
import { SuggestionsToast } from './SuggestionsToast'
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

export function SuggestedRelatives({ stableUrl }: { stableUrl?: string }) {
  const [suggestedNodes, setSuggestedNodes] = React.useState<TNode[]>([])
  const [toastIsShown, showToast] = React.useState<boolean>(false)
  const [suggestionsSearchIsActive, setSuggestionsSearchIsActive] =
    React.useState<boolean>(false)
  const pageContent = React.useMemo(() => {
    const baseURL = `${document.location.protocol}//${document.location.host}`
    return exctractPageContent(document, baseURL)
  }, [stableUrl])
  const requestSuggestedAssociations = React.useMemo(
    // Using `useMemo` instead of `useCallback` to avoid eslint complains
    // https://kyleshevlin.com/debounce-and-throttle-callbacks-with-react-hooks
    () =>
      lodash.debounce(
        async (phrase: string) => {
          log.debug(`Look for "${phrase}" in Mazed`)
          setSuggestionsSearchIsActive(true)
          const response = await FromContent.sendMessage({
            type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS',
            limit: 8,
            phrase,
          })
          log.debug('Discovered', response)
          setSuggestedNodes(
            response.suggested.map((value: TNodeJson) =>
              NodeUtil.fromJson(value)
            )
          )
          if (response.suggested.length > 0) {
            showToast(true)
          }
          setSuggestionsSearchIsActive(false)
        },
        661,
        {}
      ),
    []
  )
  const [userInput, consumeKeyboardEvent] = React.useReducer(
    (_userInput: UserInput, keyboardEvent: KeyboardEvent) => {
      const newInput = updateUserInputFromKeyboardEvent(keyboardEvent)
      const { phrase } = newInput
      if (phrase != null && phrase.length > 3) {
        requestSuggestedAssociations(phrase)
      }
      return newInput
    },
    {
      target: null,
      phrase: null,
    }
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
  }, [])
  return (
    <>
      {toastIsShown ? (
        <SuggestionsToast
          onClose={() => {
            showToast(false)
            userInput.target?.focus()
          }}
          suggested={suggestedNodes}
          isLoading={suggestionsSearchIsActive}
        />
      ) : null}
    </>
  )
}
