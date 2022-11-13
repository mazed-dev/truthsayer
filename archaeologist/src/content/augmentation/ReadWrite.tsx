import React from 'react'
import styled from '@emotion/styled'
import { log } from 'armoury'
import { MdiClose } from 'elementary'
import { Toast } from './../toaster/Toaster'
import { LogoSmall, ButtonItem, RefItem } from './../style'

const ClosePic = styled(MdiClose)`
  vertical-align: middle;
`

const TriptychToast = ({
  text,
  onClose,
}: {
  text: string
  onClose: () => void
}) => {
  return (
    <Toast toastKey={'read-write-augmentation-toast'}>
      <LogoSmall />
      <RefItem>Read/write augmentation 🐇 {text}</RefItem>
      <ButtonItem onClick={onClose}>
        <ClosePic />
      </ButtonItem>
    </Toast>
  )
}

function appendSuffixToSlidingWindow(buf: string, key: string) {
  const suffixToAppend = key.length > 1 ? ' ' : key
  return (buf + suffixToAppend).slice(-42)
}

type State = {
  keyBuffer: string
  target?: HTMLInputElement
  showToast: boolean
}
function updateStateImpl(
  state: State,
  update: KeyboardEvent | { showToast: boolean }
) {
  if ('altKey' in update) {
    // Consume KeyboardEvent
    const event = update as unknown as React.KeyboardEvent<HTMLElement>
    if ((event.target as HTMLElement).contentEditable) {
      const target = event.target as HTMLInputElement
      const keyBuffer = appendSuffixToSlidingWindow(state.keyBuffer, event.key)
      const showToast = state.showToast || keyBuffer.endsWith('//')
      log.debug('typingOnKeyDownListener editable')
      return { ...state, keyBuffer, target, showToast }
    }
  } else if ('showToast' in update) {
    return { ...state, showToast: update.showToast }
  }
  return state
}

export function ReadWriteAugmentation() {
  const [state, updateState] = React.useReducer(updateStateImpl, {
    keyBuffer: '',
    showToast: false,
  })
  React.useEffect(() => {
    document.addEventListener('keydown', updateState)
    return () => {
      document.removeEventListener('keydown', updateState)
    }
  }, [])
  log.debug('ReadWriteAugmentation :: render state', state)
  return (
    <>
      {state.showToast ? (
        <TriptychToast
          onClose={() => updateState({ showToast: false })}
          text={state.keyBuffer}
        />
      ) : null}
    </>
  )
}
