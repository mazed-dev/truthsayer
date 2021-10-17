import * as React from 'react'
import { MessageTypes } from '../../types'
import './Button.css'

export const SaveButton = () => {
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'REQ_SAVED_STATUS' })

    chrome.runtime.onMessage.addListener((message: MessageTypes) => {
      switch (message.type) {
        case 'SAVED_STATUS':
          setSaved(message.saved)
          break
        default:
          break
      }
    })
  }, [])

  const onClick = () => {
    chrome.runtime.sendMessage({ type: 'REQ_SAVE_PAGE' })
  }

  return (
    <div className="buttonContainer">
      <button className="snowButton" onClick={onClick}>
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>
  )
}
