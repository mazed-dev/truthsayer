import Cookies from "universal-cookie";
import axios from "axios";

import { LocalCrypto } from "./../crypto/local.jsx";
import { getAuth } from "./../smugler/api.js";

const _VEIL_KEY: string = "x-magic-veil";

export class UserAccount {
  _isAuthenticated: boolean = false;
  _uid: string | null = null;
  _name: string | null = null;
  _email: string | null = null;

  constructor() {
    console.log("UserAccount:constructor");
    this.axiosCancelToken = axios.CancelToken.source();
    console.log("UserAccount:constructor 1");
    this._isAuthenticated = _checkAuth();
    console.log("UserAccount:constructor 2");
    getAuth({ cancelToken: this.axiosCancelToken.token }).then((res) => {
      if (res) {
        this._uid = res.data.uid;
        this._name = res.data.name;
        this._email = res.data.email;
        // TODO(akindyakov): Init crypto/local here
        LocalCrypto.initInstance(res.data.uid, "");
      }
    });
    console.log("UserAccount:constructor 3");
  }

  getUid(): string {
    return this._uid;
  }

  getName(): string {
    return this._name;
  }

  getEmail(): string {
    return this._email;
  }

  isAuthenticated(): string {
    return this._isAuthenticated;
  }

  drop() {
    this._isAuthenticated = false;
    this.axiosCancelToken.cancel();
    _dropAuth();
    return this;
  }
}

function _checkAuth() {
  // Is it too slow?
  const cookies = new Cookies();
  return cookies.get(_VEIL_KEY) === "y";
}

function _dropAuth() {
  const cookies = new Cookies();
  cookies.remove(_VEIL_KEY);
}
