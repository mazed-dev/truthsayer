/** @jsxImportSource @emotion/react */

import React, { useContext } from 'react'

import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from 'react-router-dom'

import { css } from '@emotion/react'

import { Card, Button, Container } from 'react-bootstrap'

import { Triptych } from './card/Triptych'
import { SearchGridView } from './grid/SearchGridView'

import { GlobalNavBar } from './navbar/GlobalNavBar'
import Login from './auth/Login'
import Logout from './auth/Logout'
import { Signup } from './landing/Signup'
import PasswordChange from './auth/PasswordChange'
import PasswordRecoverForm from './auth/PasswordRecoverForm'
import PasswordRecoverRequest from './auth/PasswordRecoverRequest'
import { Notice } from './notice/Notice.js'
import WaitingForApproval from './auth/WaitingForApproval'
import UserPreferences from './auth/UserPreferences'
import { LandingPage } from './landing/LandingPage'
import { LandingPage as NewLandingPage } from './landing-page/LandingPage.tsx'
import { ProductMetaTags } from './landing/ProductMetaTags'
import { PublicPage } from './landing/PublicPage'
import UserEncryption from './UserEncryption'
import { routes } from './lib/route'
import { Loader } from './lib/loader'
import { IntegrationsOverview } from './3rdparty-integration/3rdpartyIntegrationsOverview'
import { AppsList } from './apps-list/AppsList'

import { MzdGlobal, MzdGlobalContext } from './lib/global'
import { TermsOfService } from './legal/TermsOfService'
import { CookiePolicy } from './legal/CookiePolicy'
import { PrivacyPolicy } from './legal/PrivacyPolicy'

class App extends React.Component {
  render() {
    return (
      <MzdGlobal>
        <AppRouter />
      </MzdGlobal>
    )
  }
}

function AppRouter() {
  return (
    <Router>
      <ProductMetaTags />
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
          <Route path={routes.logout}>
            <Logout />
          </Route>
          <Route path={'/new-landing-page'}>
            <NewLandingPage />
          </Route>
          <PublicOnlyRoute path={routes.login}>
            <Login />
          </PublicOnlyRoute>
          <PublicOnlyRoute path={routes.signup}>
            <Signup />
          </PublicOnlyRoute>
          <PublicRoute path="/waiting-for-approval">
            <WaitingForApproval path="/waiting-for-approval" />
          </PublicRoute>
          <PrivateRoute path={routes.search}>
            <SearchGridView />
          </PrivateRoute>
          <PublicRoute path={routes.node}>
            <TriptychView />
          </PublicRoute>
          <PrivateRoute path="/account">
            <AccountView />
          </PrivateRoute>
          <PrivateRoute path="/user-preferences">
            <UserPreferences />
          </PrivateRoute>
          <PrivateRoute path="/3rdparty-integrations">
            <IntegrationsOverview />
          </PrivateRoute>
          <PrivateRoute path="/user-encryption">
            <UserEncryption />
          </PrivateRoute>
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
          <PublicRoute exact path={routes.empty} />
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
function PrivateRoute({ children, ...rest }) {
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
function PublicOnlyRoute({ children, ...rest }) {
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
function PublicRoute({ children, ...rest }) {
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
  const { token } = useParams()
  return <PasswordRecoverForm token={token} />
}

function TriptychView() {
  // We can use the `useParams` hook here to access
  // the dynamic pieces of the URL.
  const { nid } = useParams()
  return <Triptych nid={nid} />
}

export default App
