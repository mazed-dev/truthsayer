import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { TNode, TNodeJson } from 'smuggler-api'

import { FromContent } from './../../message/types'

import { SuggestionsToast } from './SuggestionsToast'
import { TextAreaCorner } from './TextAreaCorner'
import { getKeyPhraseFromText } from './keyphrase'

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

type UserInput = {
  keyBuffer: string
  target: HTMLTextAreaElement | null
  phrase: string | null
}
function updateUserInputFromKeyboardEvent(
  userInput: UserInput,
  keyboardEvent: KeyboardEvent
) {
  if ('altKey' in keyboardEvent) {
    const event =
      keyboardEvent as unknown as React.KeyboardEvent<HTMLTextAreaElement>
    const target = event.target as HTMLTextAreaElement
    if (target.isContentEditable || target.tagName === 'TEXTAREA') {
      log.debug('Got keyboardEvent', keyboardEvent)
      let { keyBuffer } = userInput
      if (target !== userInput.target) {
        keyBuffer = ''
      }
      keyBuffer = appendSuffixToSlidingWindow(keyBuffer, event.key)
      const phrase = getKeyPhraseFromUserInput(keyBuffer, target)
      return { keyBuffer, target, phrase }
    }
  }
  return { keyBuffer: '', target: null, phrase: null }
}

export function getKeyPhraseFromUserInput(
  keyBuffer: string,
  target?: HTMLTextAreaElement
): string | null {
  if (target == null) {
    return null
  }
  const targetValue =
    (target as HTMLTextAreaElement).value ??
    target.innerText ??
    target.textContent
  if (targetValue != null) {
    const phrase = getKeyPhraseFromText(targetValue)
    return phrase
  }
  const phrase = getKeyPhraseFromText(keyBuffer)
  return phrase
}

export function WriteAugmentation() {
  const [suggestedNodes, setSuggestedNodes] = React.useState<TNode[]>([])
  const [toastIsShown, showToast] = React.useState<boolean>(false)
  const requestSuggestedAssociations = React.useMemo(
    // Using `useMemo` instead of `useCallback` to avoid eslint complains
    // https://kyleshevlin.com/debounce-and-throttle-callbacks-with-react-hooks
    () =>
      lodash.debounce(
        async (phrase: string) => {
          const response = await FromContent.sendMessage({
            type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS',
            limit: 8,
            phrase,
          })
          setSuggestedNodes(
            response.suggested.map((value: TNodeJson) => TNode.fromJson(value))
          )
        },
        919,
        {}
      ),
    []
  )
  const [userInput, consumeKeyboardEvent] = React.useReducer(
    (userInput: UserInput, keyboardEvent: KeyboardEvent) => {
      const newInput = updateUserInputFromKeyboardEvent(
        userInput,
        keyboardEvent
      )
      const { phrase } = newInput
      if (phrase != null && phrase.length > 3) {
        log.debug(`Look for "${phrase}" in Mazed`)
        requestSuggestedAssociations(phrase)
      }
      return newInput
    },
    {
      keyBuffer: '',
      target: null,
      phrase: null,
    }
  )
  React.useEffect(() => {
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('keydown', consumeKeyboardEvent, opts)
    return () => {
      window.removeEventListener('keydown', consumeKeyboardEvent, opts)
    }
  }, [])
  return (
    <>
      <TextAreaCorner
        target={userInput.target ?? undefined}
        onClick={() => showToast((isShown) => !isShown)}
        suggestionsNumber={suggestedNodes.length}
      />
      {toastIsShown ? (
        <SuggestionsToast
          onClose={() => {
            showToast(false)
            userInput.target?.focus()
          }}
          keyphrase={userInput.phrase ?? ''}
          suggested={suggestedNodes}
        />
      ) : null}
    </>
  )
}
