import Cookies from "universal-cookie";

const META_TOKEN_COOKIE_KEY = "meta-token";

function authstatus() {
  const cookies = new Cookies();
  console.log(cookies);
  const ret = cookies.get(META_TOKEN_COOKIE_KEY, { doNotParse: true });
  return ret;
}

export default authstatus;
