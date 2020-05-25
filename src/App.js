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
import TreeView from "./TreeView";
import Login from "./Login";
import Logout from "./Logout";
import Signin from "./Signin";
import TopToolBar from "./TopToolBar";

import remoteErrorHandler from "./remoteErrorHandler";

// For the future:
//    let history = useHistory();
//    history.goBack();
//    history.push(path, [state]);
//    history.replace(path, [state]);

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
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          console.log("Authenticated!");
          const auth_renewer = setTimeout(this.renew_authentication, 600000);
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
          const auth_renewer = setTimeout(this.renew_authentication, 600000);
          this.setState({
            auth_renewer: auth_renewer,
          });
          this.setState({
            authenticated: true,
          });
          console.log("Authenticated!");
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
      return <PrivateApp />;
    }
    return <HelloWorldApp />;
  }
}

class HelloWorldApp extends React.Component {
  render() {
    return (
      <Container fluid>
        <Router>
          <div>
            <LeftSideBarMenu />
            <Switch>
              <Route exact path="/">
                <SearchView />
              </Route>
              <Route exact path="/search">
                <SearchView />
              </Route>
              <Route path="/node/:id">
                <NodeView />
              </Route>
              <Route path="/thread">
                <TreeView />
              </Route>
              <Route path="/logout">
                <Logout />
              </Route>
              <Route path="/account">
                <AccountView />
              </Route>
              <Route path="/about">
                <About />
              </Route>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/signin">
                <Signin />
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
              <Route path="/logout">
                <Logout />
              </Route>
              <Route path="/account">
                <AccountView />
              </Route>
              <Route path="/about">
                <About />
              </Route>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/signin">
                <Signin />
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

function About() {
  return (
    <Container>
      <Card style={{ width: "25rem" }}>
        <Card.Img variant="top" src={logo} />
        <Card.Body>
          <Card.Title>Card Title</Card.Title>
          <Card.Text>
            Some quick example text to build on the card title and make up the
            bulk of the card's content.
          </Card.Text>
          <Button variant="primary">Go somewhere</Button>
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

function LeftSideBarMenu() {
  return (
    <div style={{ float: "left" }}>
      <ul style={{ listStyleType: "none", padding: 20 }}>
        <li>
          <Link to="/">search</Link>
        </li>
        <li>
          <Link to="/thread">thread</Link>
        </li>
        <li>
          <Link to="/logout">logout</Link>
        </li>
        <li>
          <Link to="/account">account</Link>
        </li>
        <li>
          <Link to="/about">about</Link>
        </li>
        <li>
          <Link to="/node/id">node</Link>
        </li>
        <li>
          <Link to="/node/.new">new</Link>
        </li>
        <li>
          <Link to="/login">login</Link>
        </li>
        <li>
          <Link to="/signin">signin</Link>
        </li>
      </ul>
    </div>
  );
}

export default App;
