import Cookies from "universal-cookie";
import React from "react";
import axios from "axios";

import { LocalCrypto } from "./../crypto/local.jsx";
import { getAuth } from "./../smugler/api.js";

const _VEIL_KEY: string = "x-magic-veil";

export class UserAccount {
  _uid: string;
  _name: string;
  _email: string;
  _lc: LocalCrypto;

  constructor(uid: string, name: string, email: string, lc: LocalCrypto) {
    this._uid = uid;
    this._name = name;
    this._email = email;
    this._lc = lc;
  }

  static async aCreate(cancelToken): Promise<UserAccount> {
    if (!checkAuth()) {
      return null;
    }
    const user = await getAuth({ cancelToken: cancelToken }).then((res) => {
      if (res) {
        return res.data;
      }
      return null;
    });
    if (!user) {
      return null;
    }
    const lc = await LocalCrypto.initInstance(user.uid);
    return new UserAccount(user.uid, user.name, user.email, lc);
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

  getLocalCrypto(): LocalCrypto {
    return this._lc;
  }

  isAuthenticated(): boolean {
    return checkAuth();
  }
}

export function checkAuth() {
  // Is it too slow?
  const cookies = new Cookies();
  return cookies.get(_VEIL_KEY) === "y";
}

export function dropAuth() {
  const cookies = new Cookies();
  cookies.remove(_VEIL_KEY);
}

export class Knocker extends React.Component {
  constructor(props) {
    super(props);
    this.knockCancelToken = axios.CancelToken.source();
    this.state = {
      scheduledKnocKnockId: null,
    };
  }

  componentDidMount() {
    if (checkAuth()) {
      this.scheduleKnocKnock();
    }
  }

  componentWillUnmount() {
    this.knockCancelToken.cancel();
    // https://javascript.info/settimeout-setinterval
    clearTimeout(this.state.scheduledKnocKnockId);
  }

  scheduleKnocKnock = () => {
    this.cancelDelayedKnocKnock();
    const scheduledKnocKnockId = setTimeout(this.doKnocKnock, 600000);
    this.setState({
      scheduledKnocKnockId: scheduledKnocKnockId,
    });
  };

  cancelDelayedKnocKnock = () => {
    if (!this.state.scheduledKnocKnockId !== null) {
      clearTimeout(this.state.scheduledKnocKnockId);
    }
  };

  logout = () => {
    this.cancelDelayedKnocKnock();
    this.knockCancelToken.cancel();
    dropAuth();
    this.setState({
      scheduledKnocKnockId: null,
    });
  };

  doKnocKnock = () => {
    axios
      .patch("/api/auth/session", {
        cancelToken: this.knockCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.scheduleKnocKnock();
        } else {
          this.logout();
        }
      })
      .catch((err) => {
        this.logout();
      });
  };

  render() {
    return <></>;
  }
}
