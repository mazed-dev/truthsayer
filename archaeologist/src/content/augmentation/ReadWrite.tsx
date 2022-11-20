import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'
import { TNode, TNodeJson } from 'smuggler-api'

import { FromContent } from './../../message/types'

import { SuggestionsToast } from './SuggestionsToast'

function appendSuffixToSlidingWindow(buf: string, key: string) {
  const suffixToAppend = key.length > 1 ? ' ' : key
  return (buf + suffixToAppend).slice(-42)
}

type UserInput = {
  keyBuffer: string
  target?: HTMLInputElement
}
function updateUserInputFromKeyboardEvent(
  userInput: UserInput,
  keyboardEvent: KeyboardEvent
) {
  if ('altKey' in keyboardEvent) {
    // Consume KeyboardEvent
    const event = keyboardEvent as unknown as React.KeyboardEvent<HTMLElement>
    if ((event.target as HTMLElement).contentEditable) {
      const target = event.target as HTMLInputElement
      const keyBuffer = appendSuffixToSlidingWindow(
        userInput.keyBuffer,
        event.key
      )
      // log.debug('typingOnKeyDownListener editable')
      return { keyBuffer, target }
    }
  }
  return userInput
}

function getKeyPhraseFromUserInput({ keyBuffer }: UserInput): string {
  const p = /([ \w]*)\/\/([ \w]*)/.exec(keyBuffer)
  if (p && p[2]) {
    return p[2]
  } else if (p && p[1]) {
    return p[1]
  }
  return keyBuffer
}

export function WriteAugmentation() {
  const [suggestedNodes, setSuggestedNodes] = React.useState<TNode[]>([])
  const requestSuggestedAssociations = React.useCallback(
    lodash.debounce(
      async (phrase: string) => {
        log.debug('requestSuggestedAssociations', phrase)
        const response = await FromContent.sendMessage({
          type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS',
          phrase,
        })
        setSuggestedNodes(
          response.suggested.map((value: TNodeJson) => TNode.fromJson(value))
        )
        log.debug('requestSuggestedAssociations - response', response)
      },
      900,
      {}
    ),
    []
  )
  const [toastIsShown, showToast] = React.useState<boolean>(false)
  const [userInput, consumeKeyboardEvent] = React.useReducer(
    (userInput: UserInput, keyboardEvent: KeyboardEvent) => {
      const newInput = updateUserInputFromKeyboardEvent(
        userInput,
        keyboardEvent
      )
      showToast((isShown: boolean) => {
        isShown = isShown || newInput.keyBuffer.endsWith('//')
        if (isShown) {
          const phrase = getKeyPhraseFromUserInput(newInput)
          log.debug('ShowToast for keyphrase', newInput.keyBuffer, phrase)
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
    document.addEventListener('keydown', consumeKeyboardEvent)
    return () => {
      document.removeEventListener('keydown', consumeKeyboardEvent)
    }
  }, [])
  log.debug('ReadWriteAugmentation :: render userInput', userInput)
  log.debug('ReadWriteAugmentation :: render toastIsShown', toastIsShown)
  log.debug('ReadWriteAugmentation :: render suggestedNodes', suggestedNodes)
  return (
    <>
      {toastIsShown ? (
        <SuggestionsToast
          onClose={() => showToast(false)}
          keyphrase={userInput.keyBuffer}
          suggested={suggestedNodes}
          onInsert={(text: string) => {
            log.debug('Target', userInput.target, text)
            userInput.target?.insertAdjacentText('afterend', text)
          }}
        />
      ) : null}
    </>
  )
}
