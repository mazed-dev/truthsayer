import React from "react";

import PropTypes from "prop-types";
import axios from "axios";
import { withRouter } from "react-router-dom";

import { goto } from "../lib/route.jsx";

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
      .catch(this.handleError)
      .then((res) => {
        if (res == null) {
          goto.notice.error({ history: this.props.history });
        } else {
          goto.default({ history: this.props.history });
        }
      });
  }

  handleError = (error) => {
    this.props.history.push({ pathname: "/error" });
  };

  render() {
    return <h3>Logout...</h3>;
  }
}

export default withRouter(Logout);
