import React from "react";

import {
  Modal,
  Button,
  Container,
  Card,
  Form,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";

import axios from "axios";
import keycode from "keycode";

import EmojiSmartItem from "./smartpoint/EmojiSmartItem";
import { RefSmartItem, extractRefSearcToken } from "./smartpoint/RefSmartItem";

import remoteErrorHandler from "./remoteErrorHandler";

import "./AutocompleteWindow.css";

const emoji = require("node-emoji");

class AutocompleteModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: "",
      result: [],
      result_fetch_cancel_id: null,
      cursor: 0,
    };
    this.inputRef = React.createRef();
    this.searchFetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.inputRef.current.focus();
  }

  emojiSearch = async function (input) {
    const items = emoji.search(input).map((item) => {
      return (
        <EmojiSmartItem
          label={item.emoji}
          emoji={item.emoji}
          on_insert={this.props.on_insert}
        />
      );
    });
    this.setState((state) => {
      return {
        result: state.result.concat(items),
      };
    });
  };

  refSearch = async function (input) {
    var { token, direction } = extractRefSearcToken(input);
    if (token == null) {
      return;
    }
    const req = { q: token };
    axios
      .post("/api/node-search", req, {
        cancelToken: this.searchFetchCancelToken.token,
      })
      .then((res) => {
        const items = res.data.nodes.map((meta) => {
          return (
            <RefSmartItem
              nid={meta.nid}
              preface={meta.preface}
              upd={meta.upd}
              on_insert={this.props.on_insert}
            />
          );
        });
        this.setState((state) => {
          return {
            result: state.result.concat(items),
          };
        });
      })
      .catch(remoteErrorHandler(this.props.history));
  };

  handleChange = (event) => {
    const value = event.target.value;
    // Hack to avoid fetching on every character. If the time interval between
    // 2 consecutive keystokes is too short, don't fetch results.
    const result_fetch_cancel_id =
      value && value !== ""
        ? setTimeout(() => {
            this.emojiSearch(value);
            this.refSearch(value);
          }, 200)
        : null;
    this.setState((state) => {
      if (state.result_fetch_cancel_id) {
        clearTimeout(state.result_fetch_cancel_id);
      }
      return {
        input: value,
        // Clear input
        result: [],
        // Preserve postponed fetch to be able to cancel it
        result_fetch_cancel_id: result_fetch_cancel_id,
      };
    });
  };

  handleSumbit = (event) => {};

  handleKeyDown = (e) => {
    // https://stackoverflow.com/questions/42036865/react-how-to-navigate-through-list-by-arrow-keys
    // arrow up/down button should select next/previous list element
    console.log("Key down", e.keyCode, keycode);
    if (e.keyCode === keycode("up")) {
      e.preventDefault();
      this.setState((state, props) => {
        return { cursor: state.cursor - (state.cursor > 0 ? 1 : 0) };
      });
    } else if (e.keyCode === keycode("down") || e.keyCode === keycode("tab")) {
      e.preventDefault();
      this.setState((state, props) => {
        const maxL = state.result.length > 0 ? state.result.length - 1 : 0;
        return { cursor: state.cursor >= maxL ? maxL : state.cursor + 1 };
      });
    }
  };

  render() {
    const listItems = this.state.result.map((item, index) => {
      const isActive = this.state.cursor === index;
      return (
        <ListGroup.Item as="li" active={isActive} key={index} className="p-1">
          {item}
        </ListGroup.Item>
      );
    });
    return (
      <>
        <Form.Control
          aria-label="Search-to-link"
          aria-describedby="basic-addon1"
          onChange={this.handleChange}
          onSubmit={this.handleSumbit}
          onKeyDown={this.handleKeyDown}
          value={this.state.input}
          placeholder="Search to offer"
          ref={this.inputRef}
        />
        <ListGroup as="ul" className="autocomplete-window-list-group">
          {listItems}
        </ListGroup>
      </>
    );
  }
}

class AutocompleteWindow extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // dialogAs={AutocompleteModal}
    // backdrop={false}
    // autoFocus={true}
    // onShow={this.onEntered}
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        keyboard={true}
        restoreFocus={false}
        animation={false}
        dialogClassName="autocomplete-window-top"
        scrollable={true}
        enforceFocus={true}
      >
        <AutocompleteModal on_insert={this.props.on_insert} />
      </Modal>
    );
  }
}

export default AutocompleteWindow;
