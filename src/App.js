import React from "react";

import logo from "./logo.svg";
import NodeTextEditor from "./NodeTextEditor";
import SearchView from "./SearchView";

// React router
import {
  BrowserRouter as Router,
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
  useRouteMatch,
} from "react-router-dom";

import "./App.css";

import { Card, Button, Container } from "react-bootstrap";

import TreeView from "./TreeView";
import Login from "./Login";
import TopToolBar from "./TopToolBar";

// For the future:
//    let history = useHistory();
//    history.goBack();
//    history.push(path, [state]);
//    history.replace(path, [state]);

class App extends React.Component {
  render() {
    const isAuthenticated = true; // Mock
    if (!isAuthenticated) {
      return <HelloWorld />;
    } else {
      return <PrivateApp />;
    }
  }
}

class PrivateApp extends React.Component {
  // f5f5f5
  // f0f0f0
  // #696969
  render() {
    return (
      <Container fluid>
        <Workspace />
        <Router>
          <div>
            <LeftSideBarMenu />
            <Switch>
              <Route exact path="/">
                <SearchView q={""} />
              </Route>
              <Route exact path="/search">
                <SearchView q={""} />
              </Route>
              <Route path="/node/:id">
                <TopToolBar />
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
                <NoMatch />
                <Redirect to={{ pathname: "/" }} />
              </Route>
            </Switch>
          </div>
        </Router>
      </Container>
    );
  }
}

function Logout() {
  return (
    <div>
      <h2>Logout</h2>
    </div>
  );
}

function HelloWorld() {
  return (
    <div className="App">
      <Router>
        <div>
          <ul>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/signin">Signin</Link>
            </li>
          </ul>

          <hr />

          <Switch>
            <Route exact path="/">
              <h2>Hello world!</h2>
            </Route>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/signin">
              <Signin />
            </Route>
            <Route path="/about">
              <About />
            </Route>
            <Route path="*">
              <NoMatch />
              <Redirect to={{ pathname: "/" }} />
            </Route>
          </Switch>
        </div>
      </Router>
    </div>
  );
}

function Signin() {
  return (
    <div>
      <h2>Signin</h2>
    </div>
  );
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
  let { path, url } = useRouteMatch();
  return (
    <div>
      <NodeTextEditor />
    </div>
  );
}

function CreateNode() {
  const id = "new+node+id";
  return <EditNode node_id={id} />;
}

function EditNode({ node_id }) {
  return (
    <div>
      <h3>Node title</h3>
      <p>Edit node with ID: {node_id}</p>
    </div>
  );
}

function NoMatch() {
  let location = useLocation();

  return (
    <div>
      <h3>
        No match for <code>{location.pathname}</code>
      </h3>
    </div>
  );
}

function Workspace() {
  return <div></div>;
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
