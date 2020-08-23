import Cookies from "universal-cookie";

const _VEIL_KEY = "x-magic-veil";

// function set() {
//   const cookies = new Cookies();
//   cookies.set(_VEIL_KEY, "y");
// }

function get() {
  const cookies = new Cookies();
  return cookies.get(_VEIL_KEY) === "y";
}

function drop() {
  const cookies = new Cookies();
  cookies.remove(_VEIL_KEY);
}

const authcache = {
  drop: drop,
  get: get,
  //  set: set,
};

export default authcache;
