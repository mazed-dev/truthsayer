import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { NodeUtil } from 'smuggler-api'
import type { TNode, TNodeJson } from 'smuggler-api'
import { Spinner } from 'elementary'

import { FromContent } from './../../message/types'

import { SuggestionsToast } from './SuggestionsToast'
import { TextAreaCorner } from './TextAreaCorner'

/*
function appendSuffixToSlidingWindow(buf: string, key: string): string {
  if (key === 'Backspace') {
    return buf.slice(0, -1)
  } else if (key === 'Escape' || key === 'Enter') {
    return ''
  } else if (key.length > 1) {
    // All other utility keys
    return buf
  }
  return (buf + key).slice(-42)
}
*/

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

export function WriteAugmentation() {
  const [suggestedNodes, setSuggestedNodes] = React.useState<TNode[]>([])
  const [toastIsShown, showToast] = React.useState<boolean>(false)
  const [suggestionsSearchIsActive, setSuggestionsSearchIsActive] =
    React.useState<boolean>(false)
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
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('keyup', consumeKeyboardEvent, opts)
    return () => {
      window.removeEventListener('keyup', consumeKeyboardEvent, opts)
    }
  }, [])
  return (
    <>
      <TextAreaCorner
        target={userInput.target ?? undefined}
        onClick={() => showToast((isShown) => !isShown)}
      >
        {
          /* don't show bubble if there is no suggestions */
          suggestionsSearchIsActive ? (
            <Spinner.Ring />
          ) : suggestedNodes.length === 0 ? null : (
            suggestedNodes.length.toString()
          )
        }
      </TextAreaCorner>
      {toastIsShown ? (
        <SuggestionsToast
          onClose={() => {
            showToast(false)
            userInput.target?.focus()
          }}
          suggested={suggestedNodes}
        />
      ) : null}
    </>
  )
}
