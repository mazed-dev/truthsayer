import React from "react";

import styles from "./SearchForm.module.css";

import {
  Form,
} from "react-bootstrap";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import { goto } from "./../lib/route.jsx";

class SearchFormImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.from,
    };
    this.searchCmd = React.createRef();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  componentDidMount() {
    if (this.props.inFocus) {
      this.searchCmd.current.focus();
    }
  }

  handleChange = (event) => {
    const value = event.target.value;
    const result_fetch_cancel_id =
      value === "" || value.length > 2
        ? setTimeout(() => {
            goto.search({ history: this.props.history, query: value });
          }, 250)
        : null;
    this.setState((state) => {
      if (state.result_fetch_cancel_id) {
        clearTimeout(state.result_fetch_cancel_id);
      }
      return {
        value: value,
        // Preserve postponed fetch to be able to cancel it
        result_fetch_cancel_id: result_fetch_cancel_id,
      };
    });
  };

  handleSumbit = (event) => {
    event.preventDefault();
    goto.search({ history: this.props.history, query: this.state.value });
  };

  render() {
    return (
      <Form onSubmit={this.handleSumbit} className={this.props.className}>
        <Form.Control
          aria-label="Search"
          onChange={this.handleChange}
          value={this.state.value}
          ref={this.searchCmd}
          placeholder="🔎  search"
          className={styles.search_input}
        />
      </Form>
    );
  }
}

SearchFormImpl.defaultProps = {
  callback: null,
  from: "",
};

export const SearchForm = withRouter(SearchFormImpl);
