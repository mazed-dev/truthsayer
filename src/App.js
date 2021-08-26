import React, { useContext } from 'react'

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
import PasswordChange from './auth/PasswordChange'
import PasswordRecoverForm from './auth/PasswordRecoverForm'
import PasswordRecoverRequest from './auth/PasswordRecoverRequest'
import { Notice } from './notice/Notice.js'
import WaitingForApproval from './auth/WaitingForApproval'
import UserPreferences from './auth/UserPreferences'
import WelcomePage from './WelcomePage'
import UserEncryption from './UserEncryption'
import { routes } from './lib/route.jsx'
import { Loader } from './lib/loader'

import { MzdGlobal, MzdGlobalContext } from './lib/global'

import { debug } from './util/log'

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

function AppRouter() {
  return (
    <Router>
      <div>
        <GlobalNavBar />
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
            <SearchView />
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
          <PrivateRoute path="/user-encryption">
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
      </div>
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
  const { nid } = useParams()
  return <Triptych nid={nid} />
}

function SearchView() {
  const location = useLocation()
  const params = parse(location.search)
  return <SearchGrid q={params.q} defaultSearch />
}

export default App
