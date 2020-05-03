// TODO(akindyakov) delete it : import Cookies from "universal-cookie";

import Cookies from "js-cookie";

const META_TOKEN_KEY = "x-meta-token";

function store(token) {
  Cookies.set(META_TOKEN_KEY, token);
}

function from_headers(headers) {
  console.log(headers);
  const token = headers[META_TOKEN_KEY];
  if (token) {
    Cookies.set(META_TOKEN_KEY, token);
    return true;
  }
  return false;
}

function drop() {
  Cookies.delete(META_TOKEN_KEY);
}

function get() {
  console.log(Cookies.get());
  return Cookies.get(META_TOKEN_KEY);
}

const auth = {
  store: store,
  drop: drop,
  get: get,
  from_headers: from_headers,
};

export default auth;
