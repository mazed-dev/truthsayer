/** @jsxImportSource @emotion/react */

import React from 'react'

import { Toast } from 'react-bootstrap'

const kMzdToastDefaultDelay = 4943 // Just a random number close to 5 seconds

export function NotificationToast({
  title,
  message,
  delay,
}: {
  title: string
  message: string
  delay?: number
}) {
  delay = delay ?? kMzdToastDefaultDelay
  const [show, setShow] = React.useState<boolean>(true)
  const hide = () => setShow(false)
  return (
    <Toast onClose={hide} show={show} delay={delay} autohide>
      <Toast.Header>
        <strong className="mr-auto">{title}</strong>
      </Toast.Header>
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  )
}

export { Toast }
