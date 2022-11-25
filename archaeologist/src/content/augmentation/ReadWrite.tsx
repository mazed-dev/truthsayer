import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { TNode, TNodeJson } from 'smuggler-api'

import { FromContent } from './../../message/types'

import { SuggestionsToast } from './SuggestionsToast'
import { TextAreaCornerTag } from './TextAreaCornerTag'

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
  target?: HTMLElement
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
      log.debug('typingOnKeyDownListener editable')
      return { keyBuffer, target }
    }
  }
  log.debug('typingOnKeyDownListener NOT editable')
  return { keyBuffer: '', target: undefined }
}

function getKeyPhraseFromUserInput({ keyBuffer }: UserInput): string {
  const p = /([ \w]*)\/\/(.*)/.exec(keyBuffer)
  if (p && p[2]) {
    return p[2]
  } else if (p && p[1]) {
    return p[1]
  }
  return keyBuffer
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
        if (response.suggested.length > 0) {
          showToast(true)
        }
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
      showToast((isShown: boolean) => {
        isShown = isShown || newInput.keyBuffer.endsWith('//')
        if (isShown || newInput.keyBuffer.replace(/\s/g, '').length > 5) {
          const phrase = getKeyPhraseFromUserInput(newInput)
          log.debug(`Look for "${phrase}" in Mazed`)
          requestSuggestedAssociations(phrase)
        }
        return isShown
      })
      return newInput
    },
    {
      keyBuffer: '',
      target: undefined,
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
        target={userInput.target}
        onClick={() => showToast((isShown) => !isShown)}
      >
        98
      </TextAreaCornerTag>
      {toastIsShown ? (
        <SuggestionsToast
          onClose={() => showToast(false)}
          keyphrase={userInput.keyBuffer}
          suggested={suggestedNodes}
        />
      ) : null}
    </>
  )
}
