import React from "react";

import axios from "axios";

import { Redirect } from "react-router-dom";

import { withRouter } from "react-router-dom";

import remoteErrorHandler from "./remoteErrorHandler";

class Logout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      in_progress: true,
    };
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
          this.setState({ in_progress: false });
        }
      })
      .catch(remoteErrorHandler(this.props.history));
  }

  render() {
    if (this.state.in_progress) {
      return <h3>Logout...</h3>;
    }
    return <Redirect to={{ pathname: "/" }} />;
  }
}

export default withRouter(Logout);
