import React from "react";

import { Modal, Form, ListGroup } from "react-bootstrap";

import axios from "axios";
import keycode from "keycode";

import { refSmartItemSearch } from "./RefSmartSearch";
import { dateTimeSmartItemSearch } from "./DateTimeSmartItem";
import { nextRefSmartItemSearch } from "./NextRefSmartItem";
import { SearchGrid } from "./../grid/SearchGrid";

import remoteErrorHandler from "./../remoteErrorHandler";

import styles from "./AutocompleteWindow.module.css";

class AutocompleteModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: "",
      q: "",
      cards: [],
      startSmartSearchTimeout: 0,
      cursor: 0,
    };
    this.inputRef = React.createRef();
    this.searchFetchCancelToken = axios.CancelToken.source();
    this.addNodeRefCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.inputRef.current.focus();
  }

  componentWillUnmount() {
    this.searchFetchCancelToken.cancel();
  }

  refSearch = async function (input) {
    this.setState({
      q: input,
    });
  };

  appendCards = (cards) => {
    this.setState((state) => {
      return {
        cards: state.cards.concat(cards),
      };
    });
  };

  dateTimeSearch = async function (input) {
    //*dbg*/ console.log("dateTimeSearch", this.props.nid);
    const items = dateTimeSmartItemSearch(input, this.props.on_insert);
    this.appendCards(items);
  };

  nextRefSearch = async function (input) {
    //*dbg*/ console.log("Next ref search", this.props.nid);
    const items = nextRefSmartItemSearch(
      input,
      this.props.nid,
      this.props.on_insert
    );
    this.appendCards(items);
  };

  startSmartSearch = (input) => {
    console.log("startSmartSearch", input);
    this.setState(
      {
        cards: [],
      },
      () => {
        this.nextRefSearch(input);
        this.dateTimeSearch(input);
        this.refSearch(input);
      }
    );
  };

  handleChange = (event) => {
    const input = event.target.value;
    if (this.state.startSmartSearchTimeout) {
      clearTimeout(this.state.startSmartSearchTimeout);
    }
    this.setState({
      input: input,
      // Hack to avoid fetching on every character. If the time interval between
      // 2 consecutive keystokes is too short, don't fetch results.
      startSmartSearchTimeout: setTimeout(() => {
        this.startSmartSearch(input);
      }, 750),
    });
  };

  handleSumbit = (event) => {};

  handleKeyDown = (e) => {
    // https://stackoverflow.com/questions/42036865/react-how-to-navigate-through-list-by-arrow-keys
    // arrow up/down button should select next/previous list element
    if (e.keyCode === keycode("up")) {
      e.preventDefault();
      this.setState((state, props) => {
        return { cursor: state.cursor - (state.cursor > 0 ? 1 : 0) };
      });
    } else if (e.keyCode === keycode("down")) {
      e.preventDefault();
      this.setState((state, props) => {
        const maxL = state.cards.length > 0 ? state.cards.length - 1 : 0;
        return { cursor: state.cursor >= maxL ? maxL : state.cursor + 1 };
      });
    } else if (e.keyCode === keycode("enter") || e.keyCode === keycode("tab")) {
      e.preventDefault();
      const item = this.state.cards[this.state.cursor];
      item.ref.current.handleSumbit();
    }
  };

  setActiveItem = (index) => {
    this.setState({ cursor: index });
  };

  onNodeCardClick = (nid) => {
    const title = "ref"; // FIXME
    const replacement = "[" + title + "](" + nid + ")";
    this.props.on_insert(replacement);
    const req = {
      edges: [
        {
          from_nid: this.props.nid,
          to_nid: nid,
        },
      ],
    };
    axios
      .post("/api/node/" + this.props.nid + "/edge", req, {
        cancelToken: this.addNodeRefCancelToken.token,
      })
      .then((res) => {
        if (res) {
          // TODO(akindyakov): Refresh node references here, but how to do that?
        }
      });
  };

  render() {
    const cardsGrid = (
      <SearchGrid
        q={this.state.q}
        defaultSearch={false}
        onCardClick={this.onNodeCardClick}
        extCards={this.state.cards}
      />
    );
    // onKeyDown={this.handleKeyDown}
    return (
      <div className={styles.autocomplete_modal}>
        <Form.Control
          aria-label="Search-to-link"
          aria-describedby="basic-addon1"
          onChange={this.handleChange}
          onSubmit={this.handleSumbit}
          value={this.state.input}
          placeholder="Type something"
          ref={this.inputRef}
        />
        {cardsGrid}
      </div>
    );
  }
}

class AutocompleteWindow extends React.Component {
  render() {
    // dialogAs={AutocompleteModal}
    // backdrop={false}
    // autoFocus={true}
    // onShow={this.onEntered}
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        keyboard={true}
        restoreFocus={false}
        animation={false}
        dialogClassName={""}
        scrollable={true}
        enforceFocus={true}
      >
        <AutocompleteModal
          on_insert={this.props.on_insert}
          nid={this.props.nid}
        />
      </Modal>
    );
  }
}

export default AutocompleteWindow;
