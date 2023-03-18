/** @jsxImportSource @emotion/react */

import React, { useCallback } from 'react'

import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useParams,
  RouteProps,
  useHistory,
} from 'react-router-dom'

import { css } from '@emotion/react'

import { Card, Button, Container } from 'react-bootstrap'
import { PostHog } from 'posthog-js'
import { useAsyncEffect } from 'use-async-effect'

import { Triptych } from './card/Triptych'
import { SearchGridView } from './grid/SearchGridView'

import { GlobalNavBar } from './navbar/GlobalNavBar'
import { Login } from './auth/Login'
import Logout from './auth/Logout'
import { Signup } from './account/create/Signup'
import PasswordChange from './auth/PasswordChange'
import PasswordRecoverForm from './auth/PasswordRecoverForm'
import PasswordRecoverRequest from './auth/PasswordRecoverRequest'
import { Notice } from './notice/Notice.js'
import WaitingForApproval from './account/create/WaitingForApproval'
import { GoToInboxToConfirmEmail } from './account/create/GoToInboxToConfirmEmail'
import UserPreferences from './auth/UserPreferences'
import { LandingPage } from './landing-page/LandingPage'
import { Onboarding } from './account/onboard/Onboarding'
import {
  TruthsayerPath,
  PasswordRecoverFormUrlParams,
  TriptychUrlParams,
} from './lib/route'
import { Loader } from './lib/loader'
import { ExternalImport } from './external-import/ExternalImport'
import { Export } from './export/Export'
import { AppsList } from './apps-list/AppsList'
import { AppHead } from './AppHead'

import { MzdGlobal } from './lib/global'
import {
  TermsOfService,
  CookiePolicy,
  CookiePolicyPopUp,
  PrivacyPolicy,
} from './public-page/legal/Index'
import { errorise, log, productanalytics, sleep } from 'armoury'
import { ApplicationSettings } from './AppSettings'
import {
  AccountInterface,
  authCookie,
  createUserAccount,
  UserAccount,
} from 'smuggler-api'
import { KnockerElement } from './auth/Knocker'
import {
  FromTruthsayer,
  ToTruthsayer,
} from 'truthsayer-archaeologist-communication'
import { ArchaeologistState } from './apps-list/archaeologistState'

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
      setArchaeologistState({
        state: 'installed',
        version: await waitForArchaeologistToLoad(),
      })
    } catch (err) {
      setArchaeologistState({ state: 'not-installed' })
    }
  }, [])

  const publicOnlyRoutes = [
    <TruthsayerRoute key={'mzd-pubonly-route-0'} exact path="/">
      <LandingPage />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pubonly-route-1'} path={'/login'}>
      <Login />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pubonly-route-2'} path={'/signup'}>
      <Signup />
    </TruthsayerRoute>,
    <TruthsayerRoute
      key={'mzd-pubonly-route-3'}
      path="/password-recover-request"
    >
      <PasswordRecoverRequest />
    </TruthsayerRoute>,
    <TruthsayerRoute
      key={'mzd-pubonly-route-4'}
      path="/password-recover-reset/:token"
    >
      <PasswordRecoverFormView />
    </TruthsayerRoute>,
    <Route key={'mzd-pubonly-route-5'} path="*">
      <Redirect to={{ pathname: '/' }} />
    </Route>,
  ]

  const publicRoutes = [
    <TruthsayerRoute
      key={'mzd-pub-route-0'}
      path="/account/create/waiting-for-approval"
    >
      <WaitingForApproval path="/account/create/waiting-for-approval" />
    </TruthsayerRoute>,
    <TruthsayerRoute
      key={'mzd-pub-route-1'}
      path="/account/create/go-to-inbox-to-confirm-email"
    >
      <GoToInboxToConfirmEmail />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-2'} path="/apps-to-install">
      <AppsList archaeologist={archaeologistState} />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-3'} path="/help">
      <HelpInfo />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-4'} path="/about">
      <About />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-5'} path="/contacts">
      <ContactUs />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-6'} path="/notice/:page">
      <Notice />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-7'} path="/cookie-policy">
      <CookiePolicy />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-8'} path="/privacy-policy">
      <PrivacyPolicy />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-9'} path="/terms-of-service">
      <TermsOfService />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-10'} exact path={'/empty'} />,
  ]

  const privateRoutes = [
    <TruthsayerRoute key={'mzd-private-route-0'} exact path="/">
      <Redirect to={{ pathname: '/search' }} />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-private-route-1'} path={'/search'}>
      <SearchGridView />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-private-route-2'} path="/account">
      <AccountView />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-private-route-3'} path="/user-preferences">
      <UserPreferences />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-private-route-4'} path="/external-import">
      <ExternalImport
        archaeologistState={archaeologistState}
        browserHistoryImportConfig={{ modes: ['untracked', 'resumable'] }}
      />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-private-route-5'} path="/export">
      <Export />
    </TruthsayerRoute>,
    <TruthsayerRoute
      key={'mzd-private-route-6'}
      path="/password-recover-change"
    >
      <PasswordChange />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-private-route-7'} path={'/n/:nid'}>
      <TriptychView />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-private-route-8'} path="/settings">
      <ApplicationSettings archaeologistState={archaeologistState} />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-9'} path={'/logout'}>
      <Logout />
    </TruthsayerRoute>,
    <TruthsayerRoute key={'mzd-pub-route-9'} path={'/onboarding'}>
      <Onboarding archaeologistState={archaeologistState} />
    </TruthsayerRoute>,
  ]

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
        <Switch>
          {publicRoutes}
          {authorisationLikelyComplete ? (
            account != null ? (
              <MzdGlobal analytics={analytics} account={account}>
                {privateRoutes}
              </MzdGlobal>
            ) : (
              <Loader size={'large'} />
            )
          ) : (
            publicOnlyRoutes
          )}
        </Switch>
      </Container>
    </Router>
  )
}

function TruthsayerRoute(props: RouteProps & { path: TruthsayerPath }) {
  return <Route {...props} />
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

function About() {
  return (
    <Container>
      <Card>
        <Card.Body>
          <Card.Title>To be done</Card.Title>
          <Card.Text>To be done</Card.Text>
          <Button variant="primary">Go somewhere</Button>
        </Card.Body>
      </Card>
    </Container>
  )
}

function ContactUs() {
  return (
    <Container>
      <h2>Contact us</h2>
      <Card>
        <Card.Body>
          <Card.Text>
            For any questions, email us at{' '}
            <a href="mailto:mazed@fastmail.com">mazed@fastmail.com</a>
          </Card.Text>
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
  return <PasswordRecoverForm token={token} />
}

function TriptychView() {
  // We can use the `useParams` hook here to access
  // the dynamic pieces of the URL.
  const { nid } = useParams<TriptychUrlParams>()
  return <Triptych nid={nid} />
}

// Based on https://www.sheshbabu.com/posts/automatic-pageview-tracking-using-react-router/
function PageviewEventTracker({ analytics }: { analytics: PostHog }) {
  const track = useCallback(() => {
    // See https://posthog.com/docs/integrate/client/js#one-page-apps-and-page-views
    // for more information about pageview events in PostHog
    analytics.capture('$pageview')
  }, [analytics])

  const history = useHistory()
  React.useEffect(() => {
    const unregister = history.listen(track)
    return unregister
  }, [history, track])

  return <div />
}

async function waitForArchaeologistToLoad(): Promise<ToTruthsayer.ArchaeologistVersion> {
  const maxAttempts = 5
  let error = ''
  for (let attempt = 0; attempt < maxAttempts; ++attempt) {
    try {
      const response = await FromTruthsayer.sendMessage({
        type: 'GET_ARCHAEOLOGIST_STATE_REQUEST',
      })
      return response.version
    } catch (reason) {
      if (attempt === maxAttempts - 1) {
        error = errorise(reason).message
      }
    }
    sleep(100)
  }
  throw new Error(
    `Failed to get archaeologist state after ${maxAttempts} attempts. ` +
      `Last error: ${error}`
  )
}
