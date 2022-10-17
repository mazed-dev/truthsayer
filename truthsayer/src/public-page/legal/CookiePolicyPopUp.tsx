/** @jsxImportSource @emotion/react */

import React from 'react'
import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { Toast } from '../../lib/Toaster'
import { MazedPath } from '../../lib/route'
import { ImgButton } from 'elementary'
import { accountConfig } from '../../account/config'

function CpLink({ children }: React.PropsWithChildren<{}>) {
  const href: MazedPath = '/cookie-policy'
  return (
    <a
      href={href}
      css={css`
        color: black;
        &:hover {
          text-decoration: none;
          color: black;
          opacity: 0.9;
        }
      `}
    >
      {children}
    </a>
  )
}

const AcceptButton = styled(ImgButton)`
  padding: 4px;
  margin: 4px;
`

function CookiePolicyToast({ onAccept }: { onAccept: () => void }) {
  const [show, setShow] = React.useState<boolean>(true)
  const accept = () => {
    onAccept()
    setShow(false)
  }
  return (
    <Toast
      show={show}
      css={css`
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 5;
      `}
    >
      <Toast.Body>
        🍪 Mazed uses cookies to ensure you get the best experience.{' '}
        <CpLink>More info.</CpLink>
      </Toast.Body>
      <div
        css={css`
          display: flex;
          justify-content: center;
        `}
      >
        <AcceptButton onClick={accept}>OK</AcceptButton>
      </div>
    </Toast>
  )
}

export function CookiePolicyPopUp() {
  const [choice, setChoice] = React.useState<boolean | null>(null)
  React.useEffect(() => {
    const c = accountConfig.local.cookieConsent.get()
    setChoice(c.acked)
  }, [])
  const onAccept = () => {
    if (accountConfig.local.cookieConsent.set({ acked: true })) {
      setChoice(true)
    }
  }
  if (choice === false) {
    return (
      <CookiePolicyToast
        key={'cookie-policy-notification'}
        onAccept={onAccept}
      />
    )
  }
  return <></>
}
