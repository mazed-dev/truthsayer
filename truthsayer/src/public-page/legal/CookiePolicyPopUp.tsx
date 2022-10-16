/** @jsxImportSource @emotion/react */

import React from 'react'
import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { MzdGlobalContext } from '../../lib/global'
import { Toast } from '../../lib/Toaster'
import { MazedPath } from '../../lib/route'
import { ImgButton } from 'elementary'
import { log } from 'armoury'
import { accountConfig } from '../../account/config'

function CookiePolicyLink({ children }: React.PropsWithChildren<{}>) {
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
  margin: 2px;
`

function CookiePolicyToast({ onAccept }: { onAccept: () => void }) {
  const [show, setShow] = React.useState<boolean>(true)
  const accept = () => {
    onAccept()
    setShow(false)
  }
  return (
    <Toast show={show}>
      <Toast.Body>
        <strong>🍪</strong> Our website uses cookies to ensure you get the best
        experience on our website.{' '}
        <CookiePolicyLink>More info.</CookiePolicyLink>
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
  const ctx = React.useContext(MzdGlobalContext)
  React.useEffect(() => {
    if (choice === false) {
      ctx.toaster.push(
        <CookiePolicyToast
          key={'cookie-policy-notification'}
          onAccept={onAccept}
        />
      )
    }
  }, [choice])
  return <></>
}
