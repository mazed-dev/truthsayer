import queryString from "query-string";

const kLogInPath = "/login";
const kSignUpPath = "/signup";
const kLogOutPath = "/logout";
const kSearchPath = "/search";
const kNodePathPrefix = "/n/";

function gotoSearch({ history, query }) {
  history.push({
    pathname: kSearchPath,
    search: queryString.stringify({ q: query }),
  });
}

function getSearchAnchor({ location }) {
  const search =
    location && location.search ? location.search : window.location.search;
  const params = queryString.parse(search);
  return { query: params.q || "" };
}

function gotoPath(history, path) {
  if (history) {
    history.push({ pathname: path });
  } else {
    window.location.href = path;
  }
}

function gotoLogIn({ history }) {
  gotoPath(history, kLogInPath);
}

function gotoSignUp({ history }) {
  gotoPath(history, kSignUpPath);
}

function gotoLogOut({ history }) {
  gotoPath(history, kLogOutPath);
}

function gotoNode({ history, nid }) {
  gotoPath(history, kNodePathPrefix + nid);
}

export const routes = {
  login: kLogInPath,
  signup: kSignUpPath,
  logout: kLogOutPath,
  search: kSearchPath,
  node: kNodePathPrefix + ":id",
};

export const goto = {
  login: gotoLogIn,
  signup: gotoSignUp,
  logout: gotoLogOut,
  node: gotoNode,
  search: gotoSearch,
};

export const anchor = {
  search: getSearchAnchor,
};
