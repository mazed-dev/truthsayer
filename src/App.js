import React from 'react';

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

import './App.css';

// For the future:
//    let history = useHistory();
//    history.goBack();
//    history.push(path, [state]);
//    history.replace(path, [state]);

class App extends React.Component {
  render() {
    const isAuthenticated = true; // Mock
    if (!isAuthenticated) {
      return (
        <HelloWorld />
      );
    } else {
      return (
        <PrivateApp />
      );
    }
  }
}

class PrivateApp extends React.Component {
  render() {
    return (
      <div>
        <Router>
          <div>
            <ul>
              <li>
                <Link to="/">Search</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/thread">Thread</Link>
              </li>
              <li>
                <Link to="/logout">Logout</Link>
              </li>
              <li>
                <Link to="/account">Account</Link>
              </li>
              <li>
                <Link to="/about">Account</Link>
              </li>
            </ul>

            <hr />

            {/*
              A <Switch> looks through all its children <Route>
              elements and renders the first one whose path
              matches the current URL. Use a <Switch> any time
              you have multiple routes, but you want only one
              of them to render at a time
            */}
            <Switch>
              <Route exact path="/">
                <Search />
              </Route>
              <Route path="/node/:id">
                <NodeView />
              </Route>
              <Route path="/thread">
                <Thread />
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
              <Route path="*">
                <NoMatch />
                <Redirect
                  to={{ pathname: "/" }}
                />
              </Route>
            </Switch>
          </div>
        </Router>
      </div>
    );
  }
}

function Search() {
  return (
    <div>
      <h2>Search</h2>
    </div>
  );
}

function Thread() {
  return (
    <div>
      <h2>Thread</h2>
    </div>
  );
}

function Logout() {
  return (
    <div>
      <h2>Logout</h2>
    </div>
  );
}

function Login() {
  return (
    <div>
      <h2>Login</h2>
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
                <Redirect
                  to={{ pathname: "/" }}
                />
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
    <div>
      <h2>About</h2>
    </div>
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
      <h2>Node</h2>
      <Switch>
        <Route exact path={path}>
          <ul>
            <li>
              <Link to={`${url}/edit`}>Edit</Link>
            </li>
          </ul>
          <ReadNode  node_id={id}/>
        </Route>
        <Route path={`${path}/edit`}>
          <ul>
            <li>
              <Link to={`${url}`}>Read</Link>
            </li>
          </ul>
          <EditNode node_id={id}/>
        </Route>
        <Route path={`${path}/create`}>
          <CreateNode />
        </Route>
        <Route path="*">
          <NoMatch />
        </Route>
      </Switch>
    </div>
  );
}

function ReadNode({node_id}) {
  return (
    <div>
      <h3>Node title</h3>
      <p>Read node with ID: {node_id}</p>
    </div>
  );
}

function CreateNode() {
  const id = "new+node+id";
  return (
    <EditNode node_id={id}/>
  );
}

function EditNode({node_id}) {
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
      <h3>No match for <code>{location.pathname}</code></h3>
    </div>
  );
}

export default App;
