import React from 'react'
import styled from '@emotion/styled'
import { Container, Row, Col } from 'react-bootstrap'

import { jcss, MdiInsertLink, MdiLinkOff } from 'elementary'

import { debug } from '../util/log'

import {
  PublicClientApplication,
  IPublicClientApplication,
  EventType,
  EventMessage,
  AuthenticationResult,
  Configuration,
  PopupRequest,
} from '@azure/msal-browser'
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
  IMsalContext,
} from '@azure/msal-react'

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;

  // I do not understand why, but 'line-height' property makes the children
  // of this button centered vertically. See https://stackoverflow.com/a/59179284/3375765
  line-height: 90%;

  &:hover {
    background-color: #d0d1d2;
  }
`

type IntegrationProps = React.PropsWithChildren<{
  icon: string
  name: string
}>

function Integration({ icon, name, children }: IntegrationProps) {
  return (
    <Row>
      <Col>{icon}</Col>
      <Col>{name}</Col>
      <Col>{children}</Col>
    </Row>
  )
}

// Most of the code for integration with OneDrive is taken from
// https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react

function setupMicrosoftSalInstance(): PublicClientApplication {
  const msalConfig: Configuration = {
    auth: {
      // Client ID value comes from https://portal.azure.com/
      clientId: 'a87d78c3-d208-470b-b433-5d7a5fa77b7b',
      authority: 'https://login.microsoftonline.com/common',
      // TODO [snikitin@outlook.com] Should somehow point to mazed.dev in a
      // production release
      redirectUri: 'http://localhost:3000',
      postLogoutRedirectUri: '/',
    },
  }

  // "Public" in MSAL terminology means "not trusted to know a secret key".
  // See https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-applications
  // for more information
  const msalInstance = new PublicClientApplication(msalConfig)

  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    msalInstance.setActiveAccount(accounts[0])
  } else if (accounts.length > 1) {
    throw new Error(
      `Unexpectedly connected to ${accounts.length} Microsoft accounts, expected at most 1`
    )
  }

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult
      const account = payload.account
      msalInstance.setActiveAccount(account)
    }
  })
  return msalInstance
}

function signIn(msalApp: IPublicClientApplication) {
  const loginRequest: PopupRequest = {
    // Below is the list of Microsoft Graph permissions the client application
    // will ask authorization for. User will need to explicitely consent.
    // See https://docs.microsoft.com/en-us/graph/permissions-reference for the
    // full list.
    //
    // In addition to being listed here, application also needs to register
    // them in Microsoft Azure.
    scopes: ['User.Read'],
  }
  msalApp.loginPopup(loginRequest)
}

function signOut(msalApp: IPublicClientApplication) {
  msalApp.logoutPopup({
    mainWindowRedirectUri: '/',
  })
}

function printAboutLoggingIn() {
  debug('Logging in!')
}

function printAboutLoggingOut() {
  debug('Logging out!')
}

export function IntegrationsOverview() {
  let msalInstance = setupMicrosoftSalInstance()
  return (
    <Container className={jcss('d-flex', 'justify-content-center')}>
      <Integration icon="☁" name="OneDrive">
        {/* Having MsalProvider as parent grants all children access to
         * '@azure/msal-react' context, hooks and components */}
        <MsalProvider instance={msalInstance}>
          {/* Pair of AuthenticatedTemplate and UnauthenticatedTemplate
          render their children conditionally - first if the user has logged in
          to a Microsoft account, second one if they didn't*/}
          <AuthenticatedTemplate>
            <Button
              onClick={() => {
                signOut(msalInstance)
              }}
            >
              <MdiLinkOff />
            </Button>
          </AuthenticatedTemplate>
          <UnauthenticatedTemplate>
            <Button
              onClick={() => {
                signIn(msalInstance)
              }}
            >
              <MdiInsertLink />
            </Button>
          </UnauthenticatedTemplate>
        </MsalProvider>
      </Integration>
    </Container>
  )
}
