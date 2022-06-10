/** @jsxImportSource @emotion/react */

import React, { useContext } from 'react'

import {
  BrowserRouter as Router,
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from 'react-router-dom'

import { css } from '@emotion/react'

import { Card, Button, Container } from 'react-bootstrap'

import { Triptych } from './card/Triptych.js'
import { SearchGridView } from './grid/SearchGridView.js'

import { GlobalNavBar } from './navbar/GlobalNavBar.js'
import Login from './auth/Login.js'
import Logout from './auth/Logout.js'
import { Signup } from './auth/Signup.js'
import PasswordChange from './auth/PasswordChange.js'
import PasswordRecoverForm from './auth/PasswordRecoverForm.js'
import PasswordRecoverRequest from './auth/PasswordRecoverRequest.js'
import { Notice } from './notice/Notice.js.js'
import WaitingForApproval from './auth/WaitingForApproval.js'
import UserPreferences from './auth/UserPreferences.js'
import WelcomePage from './WelcomePage.js'
import UserEncryption from './UserEncryption.js'
import { routes } from './lib/route.js'
import { Loader } from './lib/loader.js'
import { initDevEnv } from './dev/env.js'
import { IntegrationsOverview } from './3rdparty-integration/3rdpartyIntegrationsOverview.js'
import { AppsList } from './apps-list/AppsList.js'

import { MzdGlobal, MzdGlobalContext } from './lib/global.js'

class App extends React.Component {
  render() {
    initDevEnv()
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
      <GlobalNavBar />
      <Container
        fluid
        className="app_content"
        css={css`
          max-width: 100%;
          width: 100%;
          margin: 0;
          padding-top: 0;
          padding-bottom: 0;
          padding-left: 10px;
          padding-right: 10px;

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
          <PublicOnlyRoute path={routes.login}>
            <Login />
          </PublicOnlyRoute>
          <PublicOnlyRoute path={routes.signup}>
            <Signup />
          </PublicOnlyRoute>
          <Route path="/waiting-for-approval">
            <WaitingForApproval path="/waiting-for-approval" />
          </Route>
          <Route path={routes.logout}>
            <Logout />
          </Route>
          <PrivateRoute path={routes.search}>
            <SearchGridView />
          </PrivateRoute>
          <Route path={routes.node}>
            <TriptychView />
          </Route>
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
          <Route path="/apps-to-install">
            <AppsList />
          </Route>
          <Route path="/help">
            <HelpInfo />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/contacts">
            <ContactUs />
          </Route>
          <Route path="/privacy-policy">
            <PrivacyPolicy />
          </Route>
          <Route path="/terms-of-service">
            <TermsOfService />
          </Route>
          <PublicOnlyRoute path="/password-recover-request">
            <PasswordRecoverRequest />
          </PublicOnlyRoute>
          <PublicOnlyRoute path="/password-recover-reset/:token">
            <PasswordRecoverFormView />
          </PublicOnlyRoute>
          <PrivateRoute path="/password-recover-change">
            <PasswordChange />
          </PrivateRoute>
          <Route path="/notice/:page">
            <Notice />
          </Route>
          <Route exact path={routes.empty} />
          <Route path="*">
            <Redirect to={{ pathname: '/' }} />
          </Route>
        </Switch>
      </Container>
    </Router>
  )
}

function PrivateRoute({ children, ...rest }) {
  const location = useLocation()
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null) {
    return <Loader size={'large'} />
  }
  const isAuthenticated = account.isAuthenticated()
  if (isAuthenticated) {
    return <Route {...rest}> {children} </Route>
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

function PublicOnlyRoute({ children, ...rest }) {
  const location = useLocation()
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null) {
    return <Loader size={'large'} />
  }
  const isAuthenticated = account.isAuthenticated()
  if (!isAuthenticated) {
    return <Route {...rest}> {children} </Route>
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
    return <WelcomePage />
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
          <Card.Title>Support</Card.Title>
          <Card.Text>
            To get help with Pocket or to request features, please visit our{' '}
            <Link to={'/help'}>support page</Link>.
          </Card.Text>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <Card.Title>Author</Card.Title>
          <Card.Text>
            For questions related to business, please contact me at{' '}
            <a href="mailto:akindyakov@gmail.com">akindyakov@</a>
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  )
}

function PrivacyPolicy() {
  return (
    <Container>
      <Card border="light">
        <Card.Body>
          <Card.Title>Privacy policy</Card.Title>
          <Card.Text>To be done soon</Card.Text>
        </Card.Body>
      </Card>
    </Container>
  )
}

function TermsOfService() {
  return (
    <Container>
      <Card>
        <Card.Body>
          <Card.Title>Terms of service</Card.Title>
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
