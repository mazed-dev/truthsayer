/** @jsxImportSource @emotion/react */

import React from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Container } from 'react-bootstrap'
import { MdiLaunch } from 'elementary'
import { css } from '@emotion/react'
import { normalizeUrl } from 'armoury'
import { GoToInboxToConfirmEmailLocationState } from '../../lib/route'

function getInboxUrl(email?: string): null | string {
  try {
    if (email != null) {
      const url = email.split('@')[1]
      return normalizeUrl(url, {
        forceHttps: true,
        stripHash: true,
        stripTextFragment: true,
        stripAuthentication: true,
      })
    }
  } catch {}
  return null
}

export function GoToInboxToConfirmEmail() {
  const location_ = useLocation<GoToInboxToConfirmEmailLocationState>()
  const name = location_.state?.name ?? 'Mr X'
  const inboxUrl = getInboxUrl(location_.state?.email)
  const inboxRefEl =
    inboxUrl != null ? (
      <a href={inboxUrl}>
        inbox{' '}
        <MdiLaunch
          css={css`
            font-size: 1em;
          `}
        />
      </a>
    ) : (
      'inbox'
    )
  return (
    <Container>
      <Card className="border-0 p-4">
        <Card.Body className="p-3">
          <Card.Title>Please confirm your email address</Card.Title>
          <Card.Text>
            Dear {name}, to use your account on Mazed, you need to confirm the
            email address.
          </Card.Text>
          <Card.Text>
            Check your {inboxRefEl} and locate the confirmation email (subject:
            "Reset your Mazed password"). Follow the steps in the email to
            confirm your email address.
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  )
}
