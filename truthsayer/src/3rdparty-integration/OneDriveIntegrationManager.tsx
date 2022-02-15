/**
 * @file Implements UI widgets that user can use to manage integration between
 * their Mazed & Microsoft OneDrive.
 *
 * On a high level integration with OneDrive consists of two major parts:
 *    1. authentication & authorization (@see setupMsalInstance() )
 *    2. interactions with user data via Microsoft Graph to on behalf of an
 *      authenticated Microsoft account (@see graph() )
 */

// Significant chunk of the code for integration with OneDrive was taken from
// https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react
import styled from '@emotion/styled'

import {
  PublicClientApplication,
  IPublicClientApplication,
  EventType,
  EventMessage,
  AuthenticationResult,
  Configuration,
  PopupRequest,
  InteractionType,
} from '@azure/msal-browser'
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react'
import { DriveItem as MsGraphDriveItem } from 'microsoft-graph'
import {
  Client as MsGraphClient,
  AuthenticationHandler,
  RetryHandler,
  RetryHandlerOptions,
  HTTPMessageHandler,
} from '@microsoft/microsoft-graph-client'
import {
  AuthCodeMSALBrowserAuthenticationProvider,
  AuthCodeMSALBrowserAuthenticationProviderOptions,
} from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser'

import { MdiInsertLink, MdiLinkOff, MdiLaunch } from 'elementary'
import { Mime } from 'smuggler-api'

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;

  vertical-align: middle;
  &:hover {
    background-color: #d0d1d2;
  }
`

/**
 * Microsoft REST resources, specific to a particular Microsoft Azure environment.
 * Resources from different environments should never be mixed, this leads
 * to obscure errors.
 *
 * At the time of this writing only "production" MS environment is useful to the
 * project, so this could have been a single const instead of a type with
 * multiple implementations. However the amount of effort wasted to discover the
 * correct combination of resources has motivated to leave at least a mention of
 * different environments in here, even if only one is used in practice.
 *
 * Attempts to find any official description of how MS environments differ have
 * failed. Current implementations of this type were a result of
 * digging through various official docs, tutorials, StackOverflow questions etc.
 */
type MsEnvironment = {
  /** Authentication and authorisation resource */
  authority: string
  /**
   * Common prefix for all Microsoft Graph endpoints. See 'MsGraphEndpoint' for
   * more details
   */
  graph: string
}

const MsPreproductionEnv: MsEnvironment = {
  authority: 'https://login.windows-ppe.net/common',
  graph: 'https://graph.microsoft-ppe.com/v1.0',
}

const MsProductionEnv: MsEnvironment = {
  authority: 'https://login.microsoftonline.com/common',
  graph: 'https://graph.microsoft.com/v1.0',
}

// When concatanated with a `MsEnvironment.graph` prefix, produces a Microsoft
// graph REST endpoint. Concatanation is required if raw REST APIs are used,
// while 'MsGraphEndpoint' can be used on its own without a prefix if used with
// '@microsoft/microsoft-graph-client'
//
// See full list of endpoints at
// https://docs.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0
type MsGraphEndpoint = '/me'

// A "scope" in Microsoft Graph terminology is a granular permission. A scope
// can be associated with some specific kind of user's data, with an action
// on behalf of a user etc.
//
// See https://docs.microsoft.com/en-us/graph/permissions-reference for the
// full list of scopes.
//
// NOTE: This TS type is expected to be useful because if a developer tries to
// use a scope not listed here, it can work as a reminder that *all* scopes that
// an application needs not only have to be explicitely passed to MS Graph APIs,
// but also have to be registered in Azure Active Directory, in the "API permissions"
// section.
type MsGraphScope = 'User.Read' | 'Files.Read'

/**
 * Trivial functions to help enforce TypeScript checks in places
 * where endpoints and scopes need to be passed to Microsoft APIs that expect
 * them as raw strings.
 */
function endpoint(path: MsGraphEndpoint): MsGraphEndpoint {
  return path
}
function scopes(array: MsGraphScope[]): MsGraphScope[] {
  return array
}

/**
 * Type describing responses from REST endpoints that follow OData protocol.
 *
 * "OData" stands for "Open Data Protocol" and is used in Microsoft Graph.
 * Most interactions with Microsoft Graph have a type definition in
 * '@types/microsoft-graph', however not all of them. In particular, OData
 * responses don't have type definitions at the time of this writing - see
 * https://github.com/microsoftgraph/msgraph-typescript-typings/issues/235
 *
 * See https://www.odata.org/ for more details.
 */
type ODataResponse<T> = {
  [key: string]: any
  value: T[]
}

function setupMsalInstance(): PublicClientApplication {
  // MSAL & Microsoft Graph support a variaty of different authentication &
  // authorisation flows, each applicable to a different kind of application.
  // For single-page web applications like Mazed, the "Authorization Code Grant"
  // flow is applicable. See for more details:
  // https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

  const msalConfig: Configuration = {
    auth: {
      // Client ID value comes from https://portal.azure.com/
      clientId: 'a87d78c3-d208-470b-b433-5d7a5fa77b7b',
      authority: MsProductionEnv.authority,
      // Although I couldn't find a description of how '/' value should behave
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

function graph(msalApp: PublicClientApplication): MsGraphClient {
  // Implementation of this funciton is based on this example:
  // https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/91ef52b3a8b405e5c30ac07d9268a9956a9acd40/docs/AuthCodeMSALBrowserAuthenticationProvider.md

  const account = msalApp.getActiveAccount()
  if (!account) {
    throw new Error(
      `Attempted to use MS Graph client without a signed in Microsoft Account`
    )
  }
  const options: AuthCodeMSALBrowserAuthenticationProviderOptions = {
    account, // the AccountInfo instance to acquire the token for.
    interactionType: InteractionType.Popup,
    scopes: scopes(['User.Read', 'Files.Read']),
  }

  const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
    msalApp,
    options
  )

  // Below code constructs an instance of MsGraphClient. Microsoft Graph SDK
  // expects that in most cases it should be sufficient to construct it with the
  // "default" set of capabilities (or "middlewares" in MS terminology).
  // See https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CreatingClientInstance.md
  // for more information of what middlewares a default client will have.
  //
  // Although that works well for some Graph APIs, telemetry middleware
  // (implemented via microsoft-graph-client.TelemetryHandler) causes CORS
  // issues when downloading OneDrive files.
  // Below is a workaround for that issue, see
  // https://github.com/microsoftgraph/msgraph-sdk-javascript/issues/265#issuecomment-579654141
  // for more details
  const authenticationHandler = new AuthenticationHandler(authProvider)
  const retryHandler = new RetryHandler(new RetryHandlerOptions())
  const httpMessageHandler = new HTTPMessageHandler()
  authenticationHandler.setNext(retryHandler)
  retryHandler.setNext(httpMessageHandler)
  return MsGraphClient.initWithMiddleware({
    middleware: authenticationHandler,
  })
}

async function signIn(msalApp: IPublicClientApplication) {
  const loginRequest: PopupRequest = {
    // Below is the list of Microsoft Graph scopes the client application
    // will ask authorization for. User will need to explicitely consent.
    scopes: scopes(['User.Read', 'Files.Read']),
  }
  return msalApp.loginPopup(loginRequest)
}

async function signOut(msalApp: IPublicClientApplication) {
  return msalApp.logoutPopup({
    mainWindowRedirectUri: '/',
  })
}

async function readAllFrom(reader: ReadableStreamDefaultReader<string>) {
  let data = ''
  for (
    let chunk: { done: boolean; value?: string } = { done: false };
    !chunk.done;
    chunk = await reader.read()
  ) {
    if (chunk.value) data += chunk.value
  }

  return data
}

async function printFilesFromFolder(
  msalInstance: PublicClientApplication,
  folderPath: string
) {
  let client = graph(msalInstance)
  let response: ODataResponse<MsGraphDriveItem> = await client
    .api(`/me/drive/root:${folderPath}:/children`)
    .get()
  let driveItems: MsGraphDriveItem[] = response.value
  for (const item of driveItems) {
    if (!item.file) {
      console.log(
        `Skipping ${folderPath}/${item.name} due to unsupported item type`
      )
      continue
    }
    if (item.file.mimeType !== Mime.TEXT_PLAIN) {
      console.log(
        `Skipping ${folderPath}/${item.name} due to unsupported Mime type ${item.file.mimeType}`
      )
      continue
    }

    let stream: ReadableStream = await client
      .api(`/me/drive/items/${item.id}/content`)
      .getStream()
    let text = await readAllFrom(
      stream.pipeThrough(new TextDecoderStream()).getReader()
    )

    console.log(
      `Content of ${folderPath}/${item.name}: ${JSON.stringify(text)}`
    )
  }
}

/** Allows to manage user's integration of Microsoft OneDrive with Mazed */
export function OneDriveIntegrationManager() {
  const msalInstance = setupMsalInstance()
  return (
    // Having MsalProvider as parent grants all children access to
    // '@azure/msal-react' context, hooks and components
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
        <Button
          onClick={() =>
            printFilesFromFolder(msalInstance, '/mazed-test').catch((error) =>
              console.error(
                `Failed to call Microsoft Graph, error = '${JSON.stringify(
                  error
                )}'`
              )
            )
          }
        >
          <MdiLaunch />
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
  )
}
