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
import PublicNavBar from "./PublicNavBar";
import TreeView from "./TreeView";
import Login from "./Login";
import Logout from "./Logout";
import Signin from "./Signin";
import TopToolBar from "./TopToolBar";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      authenticated: false,
      auth_renewer: null,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  renew_authentication = () => {
    axios
      .patch("/api/auth/session", {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        if (res) {
          // console.log("Authenticated!");
          const auth_renewer = setTimeout(this.renew_authentication, 3600000);
          this.setState({
            auth_renewer: auth_renewer,
          });
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
          const auth_renewer = setTimeout(this.renew_authentication, 3600000);
          this.setState({
            auth_renewer: auth_renewer,
          });
          this.setState({
            authenticated: true,
          });
          // console.log("Authenticated!");
        }
      });
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
    // https://javascript.info/settimeout-setinterval
    clearTimeout(this.state.auth_renewer);
  }

  render() {
    if (this.state.authenticated) {
      console.log("Private App");
      return <PrivateApp />;
    }
    console.log("Public App");
    return <PublicApp />;
  }
}

class PublicApp extends React.Component {
  render() {
    return (
      <Container fluid>
        <Router>
          <div>
            <PublicNavBar />
            <Switch>
              <Route exact path="/">
                <HelloWorld />
              </Route>
              <Route path="/about">
                <About />
              </Route>
              <Route path="/contacts">
                <ContactUs />
              </Route>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/signin">
                <Signin />
              </Route>
              <Route path="/help">
                <HelpInfo />
              </Route>
              <Route path="/about">
                <About />
              </Route>
              <Route path="/privacy-policy">
                <PrivacyPolicy />
              </Route>
              <Route path="/terms-of-service">
                <TermsOfService />
              </Route>
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
class PrivateApp extends React.Component {
  render() {
    return (
      <Container fluid>
        <Router>
          <div>
            <GlobalNavBar />
            <Switch>
              <Route exact path="/">
                <SearchView q={""} />
              </Route>
              <Route exact path="/search">
                <SearchView q={""} />
              </Route>
              <Route path="/node/:id">
                <NodeView />
              </Route>
              <Route path="/thread">
                <TreeView />
              </Route>
              <Route path="/account">
                <AccountView />
              </Route>
              <Route path="/settings">
                <Settings />
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
