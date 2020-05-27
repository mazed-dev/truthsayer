import React from "react";

import axios from "axios";

import { Redirect } from "react-router-dom";

import { withRouter } from "react-router-dom";

import remoteErrorHandler from "./remoteErrorHandler";

class Logout extends React.Component {
  constructor(props) {
    super(props);
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidMount() {
    axios
      .delete("/api/auth/session", {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.props.onLogout();
        }
      })
      .catch(remoteErrorHandler(this.props.history));
  }

  render() {
    return <h3>Logout...</h3>;
  }
}

export default withRouter(Logout);
