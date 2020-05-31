const storage = require("local-storage");

const _KEY = "meta-auth-cache-is-authenticated";

function set() {
  storage.set(_KEY, true);
}

function get() {
  return storage.get(_KEY) || false;
}

function drop() {
  storage.remove(_KEY);
}

const authcache = {
  drop: drop,
  get: get,
  set: set,
};

export default authcache;
