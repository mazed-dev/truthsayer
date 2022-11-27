import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { TNode, TNodeJson } from 'smuggler-api'

import { FromContent } from './../../message/types'

import { SuggestionsToast } from './SuggestionsToast'
import { TextAreaCornerTag } from './TextAreaCornerTag'
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
  target: HTMLElement | null
  phrase: string | null
}
function updateUserInputFromKeyboardEvent(
  userInput: UserInput,
  keyboardEvent: KeyboardEvent
) {
  log.debug('KeyboardEvent', keyboardEvent)
  if ('altKey' in keyboardEvent) {
    // Consume KeyboardEvent
    const event = keyboardEvent as unknown as React.KeyboardEvent<HTMLElement>
    const target = event.target as HTMLElement
    if (
      target.isContentEditable ||
      target.nodeName === 'INPUT' ||
      target.nodeName === 'TEXTAREA'
    ) {
      let { keyBuffer } = userInput
      if (target !== userInput.target) {
        keyBuffer = ''
      }
      keyBuffer = appendSuffixToSlidingWindow(keyBuffer, event.key)
      const phrase = getKeyPhraseFromUserInput(keyBuffer, target)
      log.debug('typingOnKeyDownListener editable')
      return { keyBuffer, target, phrase }
    }
  }
  log.debug('typingOnKeyDownListener NOT editable')
  return { keyBuffer: '', target: null, phrase: null }
}

export function getKeyPhraseFromUserInput(
  keyBuffer: string,
  target?: HTMLElement
): string | null {
  if (target == null) {
    return null
  }
  const targetValue =
    (target as HTMLInputElement).value ?? target.innerText ?? target.textContent
  log.debug(
    'getKeyPhraseFromUserInput - element value',
    (target as HTMLInputElement).value
  )
  if (targetValue != null) {
    const phrase = getKeyPhraseFromText(targetValue)
    log.debug('getKeyPhraseFromUserInput - from target', phrase, targetValue)
    return phrase
  }
  const phrase = getKeyPhraseFromText(keyBuffer)
  log.debug('getKeyPhraseFromUserInput - from buffer', phrase, keyBuffer)
  return phrase
}

export function WriteAugmentation() {
  const [suggestedNodes, setSuggestedNodes] = React.useState<TNode[]>([])
  const [toastIsShown, showToast] = React.useState<boolean>(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const requestSuggestedAssociations = React.useCallback(
    lodash.debounce(
      async (phrase: string) => {
        // log.debug('requestSuggestedAssociations', phrase)
        const response = await FromContent.sendMessage({
          type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS',
          limit: 8,
          phrase,
        })
        setSuggestedNodes(
          response.suggested.map((value: TNodeJson) => TNode.fromJson(value))
        )
        // log.debug('requestSuggestedAssociations - response', response)
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
    window.addEventListener('keydown', consumeKeyboardEvent)
    return () => {
      window.removeEventListener('keydown', consumeKeyboardEvent)
    }
  }, [])
  // log.debug('ReadWriteAugmentation :: render userInput', userInput)
  // log.debug('ReadWriteAugmentation :: render toastIsShown', toastIsShown)
  // log.debug('ReadWriteAugmentation :: render suggestedNodes', suggestedNodes)
  return (
    <>
      <TextAreaCornerTag
        target={userInput.target ?? undefined}
        onClick={() => showToast((isShown) => !isShown)}
      >
        {suggestedNodes.length > 0 ? suggestedNodes.length.toString() : ''}
      </TextAreaCornerTag>
      {toastIsShown ? (
        <SuggestionsToast
          onClose={() => showToast(false)}
          keyphrase={userInput.phrase ?? ''}
          suggested={suggestedNodes}
        />
      ) : null}
    </>
  )
}
