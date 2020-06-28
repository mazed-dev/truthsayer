import React from "react";

import logo from "./logo.svg";
import FullNodeView from "./FullNodeView";
import SearchGrid from "./SearchGrid";

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

import {
  Card,
  Button,
  Container,
  ButtonGroup,
  ListGroup,
} from "react-bootstrap";

import queryString from "query-string";

import axios from "axios";

import GlobalNavBar from "./GlobalNavBar";
import Login from "./Login";
import Logout from "./Logout";
import PublicNavBar from "./PublicNavBar";
import Signin from "./Signin";
import TopToolBar from "./TopToolBar";
import TreeView from "./TreeView";
import UploadFile from "./UploadFile";
import WaitingListStatus from "./WaitingListStatus";
import PasswordRecoverRequest from "./PasswordRecoverRequest";
import PasswordRecoverForm from "./PasswordRecoverForm";

import authcache from "./auth/cache";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_authenticated: authcache.get(),
      auth_renewer: null,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  handleSuccessfulLogin = () => {
    if (!this.state.auth_renewer !== null) {
      clearTimeout(this.state.auth_renewer);
    }
    const auth_renewer = setTimeout(this.renew_authentication, 3600000);
    authcache.set();
    this.setState({
      is_authenticated: true,
      auth_renewer: auth_renewer,
    });
  };

  handleLogout = () => {
    if (!this.state.auth_renewer !== null) {
      clearTimeout(this.state.auth_renewer);
    }
    authcache.drop();
    this.setState({
      is_authenticated: false,
      auth_renewer: null,
    });
  };

  renew_authentication = () => {
    axios
      .patch("/api/auth/session", {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.handleSuccessfulLogin();
        }
      });
  };

  componentDidMount() {
    axios
      .get("/api/auth/session", {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(function (err) {})
      .then((res) => {
        if (res) {
          this.handleSuccessfulLogin();
        }
      });
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
    // https://javascript.info/settimeout-setinterval
    clearTimeout(this.state.auth_renewer);
  }

  render() {
    var nav_bar;
    var main_page;
    if (this.state.is_authenticated) {
      console.log("Private App " + window.location.pathname);
      nav_bar = <GlobalNavBar />;
      main_page = <Redirect to={{ pathname: "/search" }} />;
    } else {
      console.log("Public App " + window.location.pathname);
      nav_bar = <PublicNavBar />;
      main_page = <HelloWorld />;
    }
    return (
      <Container fluid>
        <Router>
          <div>
            {nav_bar}
            <Switch>
              <Route exact path="/">
                {main_page}
              </Route>
              <Route path="/login">
                <Login onLogin={this.handleSuccessfulLogin} />
              </Route>
              <PublicOnlyRoute
                path="/signin"
                is_authenticated={this.state.is_authenticated}
              >
                <Signin onLogin={this.handleSuccessfulLogin} />
              </PublicOnlyRoute>
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
                <SearchView />
              </PrivateRoute>
              <PrivateRoute
                path="/node/:id"
                is_authenticated={this.state.is_authenticated}
              >
                <NodeView />
              </PrivateRoute>
              <PrivateRoute
                path="/upload-file"
                is_authenticated={this.state.is_authenticated}
              >
                <UploadFile />
              </PrivateRoute>
              <PrivateRoute
                path="/thread"
                is_authenticated={this.state.is_authenticated}
              >
                <TreeView />
              </PrivateRoute>
              <PrivateRoute
                path="/account"
                is_authenticated={this.state.is_authenticated}
              >
                <AccountView />
              </PrivateRoute>
              <PrivateRoute
                path="/settings"
                is_authenticated={this.state.is_authenticated}
              >
                <Settings />
              </PrivateRoute>
              <PrivateRoute
                path="/help"
                is_authenticated={this.state.is_authenticated}
              >
                <HelpInfo />
              </PrivateRoute>
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
              <Route path="/waiting-list">
                <WaitingListStatus />
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
              <Route path="*">
                <Redirect to={{ pathname: "/" }} />
              </Route>
            </Switch>
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

function HelloWorld() {
  return (
    <Container>
      <h1>Main page</h1>
    </Container>
  );
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
        <Card.Img variant="top" src={logo} />
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
      <Card>
        <Card.Img variant="top" src={logo} />
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

function Settings() {
  return (
    <>
      <h2>Account</h2>
      <p>To be done</p>
      <Link to="/">Go back</Link>
    </>
  );
}

function PasswordRecoverFormView() {
  const { token } = useParams();
  return <PasswordRecoverForm token={token} />;
}

function NodeView() {
  // We can use the `useParams` hook here to access
  // the dynamic pieces of the URL.
  let { id } = useParams();
  return <FullNodeView nid={id} />;
}

function SearchView() {
  const location = useLocation();
  const params = queryString.parse(location.search);
  return <SearchGrid q={params.q} />;
}

export default App;
