import {
  PublicClientApplication,
  EventType,
  EventMessage,
  AuthenticationResult,
  Configuration,
} from '@azure/msal-browser'

import { MsProductionEnv } from './MicrosoftEnv'

export function makeInstance(): PublicClientApplication {
  // MSAL & Microsoft Graph support a variaty of different authentication &
  // authorisation flows, each applicable to a different kind of application.
  // For single-page web applications like Foreword, the "Authorization Code
  // Grant" flow is applicable. See for more details:
  // https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

  const msalConfig: Configuration = {
    auth: {
      // Client ID value comes from https://portal.azure.com/
      clientId: 'a87d78c3-d208-470b-b433-5d7a5fa77b7b',
      authority: MsProductionEnv.authority,
      // I couldn't find a description of how '/' value should behave
      // in the docs, but based on live tests it seems to be equivalent to
      // '<current-base-url>/', e.g. 'http://localhost:3000' which is convenient
      // since it can work both during local testing and in prod.
      //
      // NOTE: full URI has to be registered in Azure Active Directory,
      // see https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration
      // for more details
      redirectUri: '/',
      postLogoutRedirectUri: '/',
    },
    cache: {
      // When a user authenticates with Microsoft Graph via MSAL,
      // MSAL automatically caches the results and reuses them later if possible
      // to reduce the amount of login prompts user has to see.
      // 'cacheLocation' configures how access tokens are stored in a browser.
      // The default value is 'sessionStorage' which doesn't allow the login
      // session to be shared between tabs.
      //
      // If Foreword is used in a browser (as opposed to a dedicated app),
      // 'localStorage' is more convenient as it allows to reuse cached tokens
      // across multiple tabs (note that closing a tab & then opening it again
      // also falls into this category).
      // See https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-sso#sso-between-browser-tabs
      // for more details.
      cacheLocation: 'localStorage',
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
