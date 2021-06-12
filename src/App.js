import React from 'react'

// React router
import {
  BrowserRouter as Router,
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from 'react-router-dom'

import { Card, Button, Container } from 'react-bootstrap'

import { parse } from 'query-string'

import DoodledBird from './DoodledBird.svg'
import Triptych from './card/Triptych'
import { SearchGrid } from './grid/SearchGrid'

import GlobalNavBar from './navbar/GlobalNavBar'
import Login from './auth/Login'
import Logout from './auth/Logout'
import Signup from './auth/Signup'
import UploadFile from './UploadFile'
import PasswordChange from './auth/PasswordChange'
import PasswordRecoverForm from './auth/PasswordRecoverForm'
import PasswordRecoverRequest from './auth/PasswordRecoverRequest'
import { Notice } from './notice/Notice.js'
import WaitingForApproval from './auth/WaitingForApproval'
import UserPreferences from './auth/UserPreferences'
import WelcomePage from './WelcomePage'
import UserEncryption from './UserEncryption'
import { routes } from './lib/route.jsx'

import { MzdGlobal, MzdGlobalContext } from './lib/global'

import './App.css'

class App extends React.Component {
  render() {
    return (
      <Container fluid className="entire_doc">
        <MzdGlobal>
          <AppRouter />
        </MzdGlobal>
      </Container>
    )
  }
}

class AppRouter extends React.Component {
  render() {
    const account = this.context.account
    const isAuthenticated = account != null && account.isAuthenticated()
    const mainView = isAuthenticated ? (
      <Redirect to={{ pathname: '/search' }} />
    ) : (
      <WelcomePage />
    )
    return (
      <Router>
        <div>
          <GlobalNavBar />
          <Switch>
            <Route exact path="/">
              {mainView}
            </Route>
            <PublicOnlyRoute
              path={routes.login}
              is_authenticated={isAuthenticated}
            >
              <Login onLogin={this.handleSuccessfulLogin} />
            </PublicOnlyRoute>
            <PublicOnlyRoute
              path={routes.signup}
              is_authenticated={isAuthenticated}
            >
              <Signup onLogin={this.handleSuccessfulLogin} />
            </PublicOnlyRoute>
            <Route path="/waiting-for-approval">
              <WaitingForApproval path="/waiting-for-approval" />
            </Route>
            <Route path={routes.logout} is_authenticated={isAuthenticated}>
              <Logout onLogout={this.handleLogout} />
            </Route>
            <PrivateRoute
              path={routes.search}
              is_authenticated={isAuthenticated}
            >
              <SearchView />
            </PrivateRoute>
            <Route path={routes.node} is_authenticated={isAuthenticated}>
              <TriptychView />
            </Route>
            <PrivateRoute
              path="/upload-file"
              is_authenticated={isAuthenticated}
            >
              <UploadFile />
            </PrivateRoute>
            <PrivateRoute path="/account" is_authenticated={isAuthenticated}>
              <AccountView />
            </PrivateRoute>
            <PrivateRoute
              path="/user-preferences"
              is_authenticated={isAuthenticated}
            >
              <UserPreferences />
            </PrivateRoute>
            <PrivateRoute
              path="/user-encryption"
              is_authenticated={isAuthenticated}
            >
              <UserEncryption />
            </PrivateRoute>
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
            <PublicOnlyRoute
              path="/password-recover-request"
              is_authenticated={isAuthenticated}
            >
              <PasswordRecoverRequest />
            </PublicOnlyRoute>
            <PublicOnlyRoute
              path="/password-recover-reset/:token"
              is_authenticated={isAuthenticated}
            >
              <PasswordRecoverFormView />
            </PublicOnlyRoute>
            <PrivateRoute
              path="/password-recover-change"
              is_authenticated={isAuthenticated}
            >
              <PasswordChange />
            </PrivateRoute>
            <Route path="/notice/:page">
              <Notice />
            </Route>
            <Route path="*">
              <Redirect to={{ pathname: '/' }} />
            </Route>
          </Switch>
        </div>
      </Router>
    )
  }
}

AppRouter.contextType = MzdGlobalContext

function PrivateRoute({ is_authenticated, children, ...rest }) {
  const location = useLocation()
  if (is_authenticated) {
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

function PublicOnlyRoute({ is_authenticated, children, ...rest }) {
  const location = useLocation()
  if (!is_authenticated) {
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
        <Card.Img
          variant="top"
          className="mt-4"
          src={DoodledBird}
          width={300}
          height={300}
        />
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
        <Card.Img
          variant="top"
          className="mt-4"
          src={DoodledBird}
          width={300}
          height={300}
        />
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
  const { id } = useParams()
  return <Triptych nid={id} />
}

function SearchView() {
  const location = useLocation()
  const params = parse(location.search)
  // console.log("SearchView:", location, params);
  return <SearchGrid q={params.q} />
}

export default App
