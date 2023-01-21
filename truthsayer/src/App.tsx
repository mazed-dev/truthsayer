/** @jsxImportSource @emotion/react */

import React, { useCallback, useContext } from 'react'

import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
  RouteProps,
  useHistory,
} from 'react-router-dom'

import { css } from '@emotion/react'

import { Card, Button, Container } from 'react-bootstrap'
import { PostHog } from 'posthog-js'

import { Triptych } from './card/Triptych'
import { SearchGridView } from './grid/SearchGridView'

import { GlobalNavBar } from './navbar/GlobalNavBar'
import Login from './auth/Login'
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
import { PublicPage } from './public-page/PublicPage'
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

import { MzdGlobal, MzdGlobalContext } from './lib/global'
import {
  TermsOfService,
  CookiePolicy,
  CookiePolicyPopUp,
  PrivacyPolicy,
} from './public-page/legal/Index'
import { log, productanalytics } from 'armoury'
import { ApplicationSettings } from './AppSettings'

export function App() {
  const analytics = React.useMemo<PostHog | null>(
    () => productanalytics.make('truthsayer', process.env.NODE_ENV),
    []
  )
  return (
    <MzdGlobal analytics={analytics}>
      <AppHead />
      <AppRouter />
    </MzdGlobal>
  )
}

function AppRouter() {
  return (
    <Router>
      <PageviewEventTracker />
      <CookiePolicyPopUp />
      <GlobalNavBar />
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
          <Route exact path="/">
            <MainView />
          </Route>
          <Route path={'/logout'}>
            <Logout />
          </Route>
          <PublicOnlyRoute path={'/login'}>
            <Login />
          </PublicOnlyRoute>
          <PublicOnlyRoute path={'/signup'}>
            <Signup />
          </PublicOnlyRoute>
          <PublicRoute path="/account/create/waiting-for-approval">
            <WaitingForApproval path="/account/create/waiting-for-approval" />
          </PublicRoute>
          <PublicRoute path="/account/create/go-to-inbox-to-confirm-email">
            <GoToInboxToConfirmEmail />
          </PublicRoute>
          <PrivateRoute path={'/search'}>
            <SearchGridView />
          </PrivateRoute>
          <PublicRoute path={'/n/:nid'}>
            <TriptychView />
          </PublicRoute>
          <PrivateRoute path="/account">
            <AccountView />
          </PrivateRoute>
          <PrivateRoute path="/user-preferences">
            <UserPreferences />
          </PrivateRoute>
          <PrivateRoute path="/external-import">
            <ExternalImport
              browserHistoryImportConfig={{ modes: ['untracked', 'resumable'] }}
            />
          </PrivateRoute>
          <PrivateRoute path="/export">
            <Export />
          </PrivateRoute>
          <PublicRoute path="/settings">
            <ApplicationSettings />
          </PublicRoute>
          <PublicRoute path="/apps-to-install">
            <AppsList />
          </PublicRoute>
          <PublicRoute path="/help">
            <HelpInfo />
          </PublicRoute>
          <PublicRoute path="/about">
            <About />
          </PublicRoute>
          <PublicRoute path="/contacts">
            <ContactUs />
          </PublicRoute>
          <PublicOnlyRoute path="/password-recover-request">
            <PasswordRecoverRequest />
          </PublicOnlyRoute>
          <PublicOnlyRoute path="/password-recover-reset/:token">
            <PasswordRecoverFormView />
          </PublicOnlyRoute>
          <PrivateRoute path="/password-recover-change">
            <PasswordChange />
          </PrivateRoute>
          <PublicRoute path="/notice/:page">
            <Notice />
          </PublicRoute>
          <PublicRoute path="/cookie-policy">
            <CookiePolicy />
          </PublicRoute>
          <PublicRoute path="/privacy-policy">
            <PrivacyPolicy />
          </PublicRoute>
          <PublicRoute path="/terms-of-service">
            <TermsOfService />
          </PublicRoute>
          <PublicRoute exact path={'/empty'} />
          <Route path="*">
            <Redirect to={{ pathname: '/' }} />
          </Route>
        </Switch>
      </Container>
    </Router>
  )
}

/**
 * Route available only for logged-in users
 */
function PrivateRoute({
  children,
  ...rest
}: RouteProps & { path: TruthsayerPath }) {
  const location = useLocation()
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null) {
    return <Loader size={'large'} />
  }
  const isAuthenticated = account.isAuthenticated()
  if (isAuthenticated) {
    return <Route {...rest}>{children}</Route>
  } else {
    return (
      <Redirect
        to={{
          pathname: '/',
          state: { from: location },
        }}
      />
    )
  }
}

/**
 * Route available only for anonymous users
 */
function PublicOnlyRoute({
  children,
  ...rest
}: RouteProps & { path: TruthsayerPath }) {
  const location = useLocation()
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null) {
    return <Loader size={'large'} />
  }
  const isAuthenticated = account.isAuthenticated()
  if (!isAuthenticated) {
    return (
      <Route {...rest}>
        <PublicPage>{children}</PublicPage>
      </Route>
    )
  } else {
    return (
      <Redirect
        to={{
          pathname: '/',
          state: { from: location },
        }}
      />
    )
  }
}

/**
 * Route available for both anonymous and logged-in users
 */
function PublicRoute({
  children,
  ...rest
}: RouteProps & { path: TruthsayerPath }) {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null || !account.isAuthenticated()) {
    return (
      <Route {...rest}>
        <PublicPage>{children}</PublicPage>
      </Route>
    )
  } else {
    return <Route {...rest}>{children}</Route>
  }
}

function MainView() {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null) {
    return <Loader size={'large'} />
  }
  const isAuthenticated = account.isAuthenticated()
  if (isAuthenticated) {
    return <Redirect to={{ pathname: '/search' }} />
  } else {
    return <LandingPage />
  }
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
function PageviewEventTracker() {
  const ctx = useContext(MzdGlobalContext)
  const track = useCallback(() => {
    if (!ctx.analytics) {
      log.warning(
        `No product analytics initialised yet, pageview event won't be reported`
      )
      return
    }

    // See https://posthog.com/docs/integrate/client/js#one-page-apps-and-page-views
    // for more information about pageview events in PostHog
    ctx.analytics.capture('$pageview')
  }, [ctx])

  const history = useHistory()
  React.useEffect(() => {
    const unregister = history.listen(track)
    return unregister
  }, [history, track])

  return <div />
}
