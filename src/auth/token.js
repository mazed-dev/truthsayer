// TODO(akindyakov) delete it : import Cookies from "universal-cookie";

import axios from "axios";

const storage = require("local-storage");

const META_TOKEN_KEY = "x-meta-token";

function store(token) {
  storage.set(META_TOKEN_KEY, token);
  axios.defaults.headers.common[META_TOKEN_KEY] = token;
}

function from_headers(headers) {
  console.log(headers);
  const token = headers[META_TOKEN_KEY];
  if (token) {
    store(token);
    return true;
  }
  return false;
}

function drop() {
  storage.delete(META_TOKEN_KEY);
  delete axios.defaults.headers.common[META_TOKEN_KEY];
}

function get() {
  const token = storage.get(META_TOKEN_KEY);
  if (token != null) {
    axios.defaults.headers.common[META_TOKEN_KEY] = token;
  }
  return storage.get(META_TOKEN_KEY);
}

const auth = {
  store: store,
  drop: drop,
  get: get,
  from_headers: from_headers,
};

export default auth;
