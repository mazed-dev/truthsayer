import Cookies from "universal-cookie";

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
    this.updateAuthCancelToken = axios.CancelToken.source();
    this.state = {
      auth_renewer: null,
    };
  }

  componentDidMount() {
    if (checkAuth()) {
      this.delayedKnocKnock();
    }
  }

  componentWillUnmount() {
    this.updateAuthCancelToken.cancel();
    // https://javascript.info/settimeout-setinterval
    clearTimeout(this.state.auth_renewer);
  }

  delayedKnocKnock = () => {
    if (!this.state.auth_renewer !== null) {
      clearTimeout(this.state.auth_renewer);
    }
    const auth_renewer = setTimeout(this.knocKnock, 600000);
    this.setState({
      auth_renewer: auth_renewer,
    });
  };

  logout = () => {
    if (!this.state.auth_renewer !== null) {
      clearTimeout(this.state.auth_renewer);
    }
    this.updateAuthCancelToken.cancel();
    dropAuth();
    this.setState({
      auth_renewer: null,
    });
  };

  knocKnock = () => {
    axios
      .patch("/api/auth/session", {
        cancelToken: this.updateAuthCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.delayedKnocKnock();
        } else {
          this.logout();
        }
      })
      .catch((err) => {
        this.logout();
      });
  };

  render() {
    return (<></>);
  }
}
