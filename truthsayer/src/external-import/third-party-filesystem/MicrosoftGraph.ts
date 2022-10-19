import {
  Client as MsGraphClient,
  AuthenticationHandler,
  RetryHandler,
  RetryHandlerOptions,
  HTTPMessageHandler,
} from '@microsoft/microsoft-graph-client'
import { PublicClientApplication, InteractionType } from '@azure/msal-browser'
import {
  AuthCodeMSALBrowserAuthenticationProvider,
  AuthCodeMSALBrowserAuthenticationProviderOptions,
} from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser'

// When concatanated with a `MsEnvironment.graph` prefix, produces a Microsoft
// graph REST endpoint. Concatanation is required if raw REST APIs are used,
// while 'Endpoint' can be used on its own without a prefix if used with
// '@microsoft/microsoft-graph-client'
//
// See full list of endpoints at
// https://docs.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0
type Endpoint = '/me'

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
export type Scope = 'User.Read' | 'Files.Read'

/**
 * Trivial functions to help enforce TypeScript checks in places
 * where endpoints and scopes need to be passed to Microsoft APIs that expect
 * them as raw strings.
 */
export function endpoint(path: Endpoint): Endpoint {
  return path
}
export function scopes(array: Scope[]): Scope[] {
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
export type ODataResponse<T> = {
  [key: string]: any
  value: T[]
}

export function client(msalApp: PublicClientApplication): MsGraphClient {
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
