import React from "react";

import PropTypes from "prop-types";
import axios from "axios";
import { withRouter } from "react-router-dom";

import remoteErrorHandler from "./../remoteErrorHandler";

class Logout extends React.Component {
  constructor(props) {
    super(props);
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

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
        this.props.history.push({ pathname: "/" });
      })
      .catch(remoteErrorHandler(this.props.history));
  }

  render() {
    return <h3>Logout...</h3>;
  }
}

export default withRouter(Logout);
