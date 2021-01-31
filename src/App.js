import React from "react";

import DoodledBird from "./DoodledBird.svg";
import FullNodeView from "./full_node_view/FullNodeView";
import SearchGrid from "./grid/SearchGrid";

// React router
import {
  BrowserRouter as Router,
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from "react-router-dom";

import "./App.css";

import { Card, Button, Container } from "react-bootstrap";

import queryString from "query-string";

import axios from "axios";

import GlobalNavBar from "./GlobalNavBar";
import Login from "./auth/Login";
import Logout from "./auth/Logout";
import PublicNavBar from "./PublicNavBar";
import Signup from "./auth/Signup";
import UploadFile from "./UploadFile";
import PasswordChange from "./auth/PasswordChange";
import PasswordRecoverForm from "./auth/PasswordRecoverForm";
import PasswordRecoverRequest from "./auth/PasswordRecoverRequest";
import WaitingForApproval from "./auth/WaitingForApproval";
import UserPreferences from "./auth/UserPreferences";
import WelcomePage from "./WelcomePage";
import UserEncryption from "./UserEncryption";
import { MzdToaster } from "./lib/toaster";

import { UserAccount, checkAuth, dropAuth } from "./auth/local.jsx";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.updateAuthCancelToken = axios.CancelToken.source();
    this.fetchUserInfoCancelToken = axios.CancelToken.source();
    this.state = {
      is_authenticated: checkAuth(),
      account: null,
      auth_renewer: null,
    };
  }

  componentDidMount() {
    if (this.state.is_authenticated) {
      this.initialiseUserAccount();
    }
  }

  componentWillUnmount() {
    this.updateAuthCancelToken.cancel();
    this.fetchUserInfoCancelToken.cancel();
    // https://javascript.info/settimeout-setinterval
    clearTimeout(this.state.auth_renewer);
  }

  handleSuccessfulLogin = () => {
    if (checkAuth()) {
      this.setState({
        is_authenticated: true,
      });
      this.initialiseUserAccount();
    }
  };

  initialiseUserAccount = () => {
    UserAccount.aCreate(this.fetchUserInfoCancelToken.token).then((inst) => {
      if (inst != null) {
        this.setState({
          account: inst,
        });
      }
    });
    this.delayed_renew_authentication();
  };

  delayed_renew_authentication = () => {
    if (!this.state.auth_renewer !== null) {
      clearTimeout(this.state.auth_renewer);
    }
    const auth_renewer = setTimeout(this.renew_authentication, 600000);
    this.setState({
      auth_renewer: auth_renewer,
    });
  };

  handleLogout = () => {
    if (!this.state.auth_renewer !== null) {
      clearTimeout(this.state.auth_renewer);
    }
    this.updateAuthCancelToken.cancel();
    dropAuth();
    this.setState({
      is_authenticated: false,
      account: null,
      auth_renewer: null,
    });
  };

  renew_authentication = () => {
    axios
      .patch("/api/auth/session", {
        cancelToken: this.updateAuthCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.delayed_renew_authentication();
        } else {
          this.handleLogout();
        }
      })
      .catch((err) => {
        this.handleLogout();
      });
  };

  render() {
    var nav_bar;
    var main_page;
    if (this.state.is_authenticated) {
      nav_bar = <GlobalNavBar />;
      main_page = <Redirect to={{ pathname: "/search" }} />;
    } else {
      nav_bar = <PublicNavBar />;
      main_page = <WelcomePage />;
    }
    return (
      <Container fluid>
        <Router>
          <div>
            {nav_bar}
            <MzdToaster>
              <Switch>
                <Route exact path="/">
                  {main_page}
                </Route>
                <PublicOnlyRoute
                  path="/login"
                  is_authenticated={this.state.is_authenticated}
                >
                  <Login onLogin={this.handleSuccessfulLogin} />
                </PublicOnlyRoute>
                <PublicOnlyRoute
                  path="/signup"
                  is_authenticated={this.state.is_authenticated}
                >
                  <Signup onLogin={this.handleSuccessfulLogin} />
                </PublicOnlyRoute>
                <Route path="/waiting-for-approval">
                  <WaitingForApproval path="/waiting-for-approval" />
                </Route>
                <Route
                  path="/logout"
                  is_authenticated={this.state.is_authenticated}
                >
                  <Logout onLogout={this.handleLogout} />
                </Route>
                <PrivateRoute
                  path="/search"
                  is_authenticated={this.state.is_authenticated}
                >
                  <SearchView account={this.state.account} />
                </PrivateRoute>
                <PrivateRoute
                  path="/node/:id"
                  is_authenticated={this.state.is_authenticated}
                >
                  <NodeView account={this.state.account} />
                </PrivateRoute>
                <PrivateRoute
                  path="/upload-file"
                  is_authenticated={this.state.is_authenticated}
                >
                  <UploadFile />
                </PrivateRoute>
                <PrivateRoute
                  path="/account"
                  is_authenticated={this.state.is_authenticated}
                >
                  <AccountView />
                </PrivateRoute>
                <PrivateRoute
                  path="/user-preferences"
                  is_authenticated={this.state.is_authenticated}
                >
                  <UserPreferences account={this.state.account} />
                </PrivateRoute>
                <PrivateRoute
                  path="/user-encryption"
                  is_authenticated={this.state.is_authenticated}
                >
                  <UserEncryption account={this.state.account} />
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
                  is_authenticated={this.state.is_authenticated}
                >
                  <PasswordRecoverRequest />
                </PublicOnlyRoute>
                <PublicOnlyRoute
                  path="/password-recover-reset/:token"
                  is_authenticated={this.state.is_authenticated}
                >
                  <PasswordRecoverFormView />
                </PublicOnlyRoute>
                <PrivateRoute
                  path="/password-recover-change"
                  is_authenticated={this.state.is_authenticated}
                >
                  <PasswordChange />
                </PrivateRoute>
                <Route path="*">
                  <Redirect to={{ pathname: "/" }} />
                </Route>
              </Switch>
            </MzdToaster>
          </div>
        </Router>
      </Container>
    );
  }
}

function PrivateRoute({ is_authenticated, children, ...rest }) {
  const location = useLocation();
  if (is_authenticated) {
    return <Route {...rest}> {children} </Route>;
  } else {
    return (
      <Redirect
        to={{
          pathname: "/",
          state: { from: location },
        }}
      />
    );
  }
}

function PublicOnlyRoute({ is_authenticated, children, ...rest }) {
  const location = useLocation();
  if (!is_authenticated) {
    return <Route {...rest}> {children} </Route>;
  } else {
    return (
      <Redirect
        to={{
          pathname: "/",
          state: { from: location },
        }}
      />
    );
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
  );
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
  );
}

function ContactUs() {
  return (
    <Container>
      <h2>Contact us</h2>
      <Card>
        <Card.Body>
          <Card.Title>Support</Card.Title>
          <Card.Text>
            To get help with Pocket or to request features, please visit our{" "}
            <Link to={"/help"}>support page</Link>.
          </Card.Text>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <Card.Title>Author</Card.Title>
          <Card.Text>
            For questions related to business, please contact me at{" "}
            <a href="mailto:akindyakov@gmail.com">akindyakov@</a>
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
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
  );
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
  );
}

function AccountView() {
  return (
    <div>
      <h2>Account</h2>
    </div>
  );
}

function PasswordRecoverFormView() {
  const { token } = useParams();
  return <PasswordRecoverForm token={token} />;
}

function NodeView(props) {
  // We can use the `useParams` hook here to access
  // the dynamic pieces of the URL.
  let { id } = useParams();
  return <FullNodeView nid={id} account={props.account} />;
}

function SearchView(props) {
  const location = useLocation();
  const params = queryString.parse(location.search);
  return <SearchGrid q={params.q} account={props.account} />;
}

export default App;
