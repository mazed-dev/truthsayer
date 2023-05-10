/** @jsxImportSource @emotion/react */

import React from 'react'

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useParams,
  RouteProps,
  useLocation,
} from 'react-router-dom'

import { css } from '@emotion/react'

import { Card, Container } from 'react-bootstrap'
import { PostHog } from 'posthog-js'
import { useAsyncEffect } from 'use-async-effect'

import { Triptych } from './card/Triptych'
import { SearchGridView } from './grid/SearchGridView'

import { GlobalNavBar } from './navbar/GlobalNavBar'
import { Login } from './auth/Login'
import { Logout } from './auth/Logout'
import { Signup } from './account/create/Signup'
import { PasswordChange } from './auth/PasswordChange'
import { PasswordRecoverForm } from './auth/PasswordRecoverForm'
import { PasswordRecoverRequest } from './auth/PasswordRecoverRequest'
import { Notice } from './notice/Notice.js'
import { GoToInboxToConfirmEmail } from './account/create/GoToInboxToConfirmEmail'
import { UserPreferences } from './auth/UserPreferences'
import { LandingPage } from './landing-page/LandingPage'
import { Onboarding } from './account/onboard/Onboarding'
import {
  TruthsayerPath,
  PasswordRecoverFormUrlParams,
  TriptychUrlParams,
} from './lib/route'
import { Loader } from './lib/loader'
import {
  ExternalImport,
  ExternalImportProgress,
} from './external-import/ExternalImport'
import { Export } from './export/Export'
import { AppsList } from './apps-list/AppsList'
import { AppHead } from './AppHead'

import { MzdGlobal } from './lib/global'
import {
  AboutMazed,
  ContactUs,
  CookiePolicy,
  CookiePolicyPopUp,
  PrivacyPolicy,
  TermsOfService,
} from './public-page/legal/Index'
import { PublicPage } from './public-page/PublicPage'
import {
  AnalyticsIdentity,
  errorise,
  log,
  productanalytics,
  sleep,
} from 'armoury'
import { ApplicationSettings } from './AppSettings'
import {
  AccountInterface,
  authCookie,
  createUserAccount,
  UserAccount,
} from 'smuggler-api'
import { KnockerElement } from './auth/Knocker'
import {
  BackgroundActionProgress,
  FromArchaeologistContent,
  FromTruthsayer,
  ToTruthsayer,
} from 'truthsayer-archaeologist-communication'
import { ArchaeologistState } from './apps-list/archaeologistState'
import { BrowserHistoryImporterLoadingScreen } from './external-import/BrowserHistoryImporterLoadingScreen'

function isAuthenticated(account: AccountInterface): account is UserAccount {
  return account.isAuthenticated()
}

export function App() {
  return (
    <>
      <KnockerElement />
      <AppHead />
      <AppRouter />
    </>
  )
}

function AppRouter() {
  const analytics = React.useMemo<PostHog | null>(
    () => productanalytics.make('truthsayer', process.env.NODE_ENV),
    []
  )

  const [account, setAccount] = React.useState<UserAccount | null>(null)
  useAsyncEffect(async () => {
    if (account != null) {
      return
    }
    const acc = await createUserAccount()
    if (!isAuthenticated(acc)) {
      log.warning(
        "Failed to initialise user account, most functionality won't work until the page reloads"
      )
      return
    }
    log.info('Initialised an authenticated user account')
    setAccount(acc)
  }, [])
  const [archaeologistState, setArchaeologistState] =
    React.useState<ArchaeologistState>({ state: 'loading' })
  useAsyncEffect(async () => {
    try {
      const result = await waitForArchaeologistToLoad()
      analytics?.identify(result.analyticsIdentity.analyticsIdentity)
      setArchaeologistState({
        state: 'installed',
        version: result.version,
      })
    } catch (err) {
      setArchaeologistState({ state: 'not-installed' })
    }
  }, [])

  const [historyImportProgress, setHistoryImportProgress] =
    React.useState<BackgroundActionProgress>({
      processed: 0,
      total: 0,
    })
  const [openTabsImportProgress, setOpenTabsProgress] =
    React.useState<BackgroundActionProgress>({
      processed: 0,
      total: 0,
    })
  const externalImportProgress: ExternalImportProgress = {
    historyImportProgress,
    openTabsProgress: openTabsImportProgress,
  }
  React.useEffect(() => {
    const listener = (
      event: MessageEvent
    ): void /**this messaging channel doesn't natively support posting back responses*/ => {
      // Only accept messages sent from archaeologist's content script
      // eslint-disable-next-line eqeqeq
      if (event.source != window) {
        return
      }

      // Discard any events that are not part of truthsayer/archaeologist
      // business logic communication
      const request = event.data
      if (!FromArchaeologistContent.isRequest(request)) {
        return
      }

      switch (request.type) {
        case 'REPORT_BACKGROUND_OPERATION_PROGRESS': {
          switch (request.operation) {
            case 'open-tabs-upload': {
              setOpenTabsProgress(request.newState)
              break
            }
            case 'browser-history-upload': {
              setHistoryImportProgress(request.newState)
              break
            }
          }
        }
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  })

  const authorisationLikelyComplete = authCookie.veil.check()

  return (
    <Router>
      {analytics != null ? (
        <PageviewEventTracker analytics={analytics} />
      ) : null}
      <CookiePolicyPopUp />
      {account != null ? <GlobalNavBar /> : null}
      <Container
        fluid
        className="app_content"
        css={css`
          max-width: 100%;
          width: 100%;
          margin: 0;
          padding: 0;

          font-family: 'Roboto', arial, sans-serif;
          font-style: normal;
          font-weight: 400;

          @media (min-width: 480px) {
            .app_content {
              padding-left: 4px;
              /* Reserve space for scrollbar on the right side */
              padding-right: 6px;
            }
          }
        `}
      >
        <Routes>
          <TruthsayerRoute
            key={'mzd-pub-route-1'}
            path="/account/create/go-to-inbox-to-confirm-email"
            element={<GoToInboxToConfirmEmail />}
          />
          <TruthsayerRoute
            key={'mzd-pub-route-2'}
            path="/apps-to-install"
            element={
              <PublicPage>
                <AppsList archaeologist={archaeologistState} />
              </PublicPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pub-route-3'}
            path="/help"
            element={
              <PublicPage>
                <HelpInfo />
              </PublicPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pub-route-4'}
            path="/about"
            element={
              <PublicPage>
                <AboutMazed />
              </PublicPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pub-route-5'}
            path="/contacts"
            element={
              <PublicPage>
                <ContactUs />
              </PublicPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pub-route-6'}
            path="/notice/:page"
            element={
              <PublicPage>
                <Notice />
              </PublicPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pub-route-7'}
            path="/cookie-policy"
            element={
              <PublicPage>
                <CookiePolicy />
              </PublicPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pub-route-8'}
            path="/privacy-policy"
            element={
              <PublicPage>
                <PrivacyPolicy />
              </PublicPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pub-route-9'}
            path="/terms-of-service"
            element={
              <PublicPage>
                <TermsOfService />
              </PublicPage>
            }
          />
          <TruthsayerRoute key={'mzd-pub-route-10'} path={'/empty'} />
          <TruthsayerRoute
            key={'mzd-pubonly-route-0'}
            path="/"
            element={
              <PublicOnlyPage
                authorisationLikelyComplete={authorisationLikelyComplete}
              >
                <LandingPage />
              </PublicOnlyPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pubonly-route-1'}
            path={'/login'}
            element={
              <PublicOnlyPage
                authorisationLikelyComplete={authorisationLikelyComplete}
              >
                <PublicPage>
                  <Login />
                </PublicPage>
              </PublicOnlyPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pubonly-route-2'}
            path={'/signup'}
            element={
              <PublicOnlyPage
                authorisationLikelyComplete={authorisationLikelyComplete}
              >
                <PublicPage>
                  <Signup />
                </PublicPage>
              </PublicOnlyPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pubonly-route-3'}
            path="/password-recover-request"
            element={
              <PublicOnlyPage
                authorisationLikelyComplete={authorisationLikelyComplete}
              >
                <PublicPage>
                  <PasswordRecoverRequest />
                </PublicPage>
              </PublicOnlyPage>
            }
          />
          <TruthsayerRoute
            key={'mzd-pubonly-route-4'}
            path="/password-recover-reset/:token"
            element={
              <PublicOnlyPage
                authorisationLikelyComplete={authorisationLikelyComplete}
              >
                <PublicPage>
                  <PasswordRecoverFormView />
                </PublicPage>
              </PublicOnlyPage>
            }
          />
          <PrivatePageContext
            authorisationLikelyComplete={authorisationLikelyComplete}
            account={account ?? undefined}
            analytics={analytics ?? undefined}
          >
            <TruthsayerRoute
              key={'mzd-private-route-0'}
              path="/"
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <Navigate to={{ pathname: '/search' }} />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-1'}
              path={'/search'}
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <SearchGridView archaeologistState={archaeologistState} />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-2'}
              path="/account"
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <AccountView />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-3'}
              path="/user-preferences"
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <UserPreferences />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-4'}
              path="/external-import"
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <ExternalImport
                    archaeologistState={archaeologistState}
                    progress={externalImportProgress}
                    browserHistoryImportConfig={{
                      modes: ['untracked', 'resumable'],
                    }}
                  />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-5'}
              path="/export"
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <Export />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-6'}
              path="/password-recover-change"
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <PasswordChange />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-7'}
              path={'/n/:nid'}
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <TriptychView />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-8'}
              path="/settings"
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <ApplicationSettings
                    archaeologistState={archaeologistState}
                  />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-9'}
              path={'/logout'}
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <Logout />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-onboarding'}
              path={'/onboarding'}
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <Onboarding
                    archaeologistState={archaeologistState}
                    progress={externalImportProgress}
                  />
                </PrivateOnlyPage>
              }
            />
            <TruthsayerRoute
              key={'mzd-private-route-11'}
              path={'/browser-history-import-loading-screen'}
              element={
                <PrivateOnlyPage
                  authorisationLikelyComplete={authorisationLikelyComplete}
                >
                  <BrowserHistoryImporterLoadingScreen
                    progress={historyImportProgress}
                  />
                </PrivateOnlyPage>
              }
            />
          </PrivatePageContext>
          <Route
            key={'mzd-pubonly-route-5'}
            path="*"
            element={<Navigate to={{ pathname: '/' }} />}
          />
        </Routes>
      </Container>
    </Router>
  )
}

function TruthsayerRoute(props: RouteProps & { path: TruthsayerPath }) {
  return <Route {...props} />
}

function PublicOnlyPage({
  children,
  authorisationLikelyComplete,
}: React.PropsWithChildren<{ authorisationLikelyComplete: boolean }>) {
  if (authorisationLikelyComplete) {
    return <Navigate to="/" />
  }
  return <>{children}</>
}

function PrivateOnlyPage({
  children,
  authorisationLikelyComplete,
}: React.PropsWithChildren<{
  authorisationLikelyComplete: boolean
}>) {
  if (!authorisationLikelyComplete) {
    return <Navigate to="/" />
  }
  return <>{children}</>
}

function PrivatePageContext({
  children,
  authorisationLikelyComplete,
  account,
  analytics,
}: React.PropsWithChildren<{
  authorisationLikelyComplete: boolean
  account?: UserAccount
  analytics?: PostHog
}>) {
  if (!authorisationLikelyComplete) {
    return <Navigate to="/" />
  }
  if (account == null) {
    return <Loader size={'large'} />
  }
  return (
    <MzdGlobal analytics={analytics} account={account}>
      {children}
    </MzdGlobal>
  )
}

function HelpInfo() {
  return (
    <Container>
      <h2>All support topics</h2>
      <Card>
        <Card.Body>
          <Card.Title>To be done</Card.Title>
          <Card.Text>To be done</Card.Text>
        </Card.Body>
      </Card>
    </Container>
  )
}

function AccountView() {
  return (
    <div>
      <h2>Account</h2>
    </div>
  )
}

function PasswordRecoverFormView() {
  const { token } = useParams<PasswordRecoverFormUrlParams>()
  if (token == null) {
    return <Navigate to="/" />
  }
  return <PasswordRecoverForm token={token} />
}

function TriptychView() {
  // We can use the `useParams` hook here to access
  // the dynamic pieces of the URL.
  const { nid } = useParams<TriptychUrlParams>()
  if (nid == null) {
    return <Navigate to="/" />
  }
  return <Triptych nid={nid} />
}

// Based on https://www.sheshbabu.com/posts/automatic-pageview-tracking-using-react-router/
function PageviewEventTracker({ analytics }: { analytics: PostHog }) {
  const location = useLocation()
  React.useEffect(() => {
    // See https://posthog.com/docs/integrate/client/js#one-page-apps-and-page-views
    // for more information about pageview events in PostHog
    analytics.capture('$pageview')
  }, [location, analytics])
  return <div />
}

async function waitForArchaeologistToLoad(): Promise<{
  version: ToTruthsayer.ArchaeologistVersion
  analyticsIdentity: AnalyticsIdentity
}> {
  const maxAttempts = 5
  let error = ''
  for (let attempt = 0; attempt < maxAttempts; ++attempt) {
    try {
      const response = await FromTruthsayer.sendMessage({
        type: 'GET_ARCHAEOLOGIST_STATE_REQUEST',
      })
      return {
        version: response.version,
        analyticsIdentity: response.analyticsIdentity,
      }
    } catch (reason) {
      if (attempt === maxAttempts - 1) {
        error = errorise(reason).message
      }
    }
    await sleep(200 /* ms */)
  }
  throw new Error(
    `Failed to get archaeologist state after ${maxAttempts} attempts. ` +
      `Last error: ${error}`
  )
}
