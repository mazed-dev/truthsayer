import React from "react";

import "./components.css";

import { Link as ReactRouterLink } from "react-router-dom";

import { ControlButton } from "./../editor/ControlButton";

import { joinClasses } from "../../util/elClass.js";

import styles from "./Link.module.css";

function onBlur() {
  console.log("onBlur");
}

function onFocus() {
  console.log("onFocus");
}

function onClick(e) {
  e.preventDefault();
  console.log("onClick --- ");
}

export class Link extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
    };
  }
  onMouseEnterHandler = () => {
    this.setState({
      hover: true,
    });
    console.log("enter");
  };

  onMouseLeaveHandler = () => {
    this.setState({
      hover: false,
    });
    console.log("leave");
  };

  makeToolbar() {
    return (
      <div className={styles.popover_root}>
        <div className={styles.popover}>
          <input
            onChange={this._onURLChange}
            className={styles.urlInput}
            type="text"
            value={this.state.urlValue}
            onKeyDown={this._onLinkInputKeyDown}
            ref={(x) => (this.urlRef = x)}
          />
          <ControlButton onClick={this._confirmLink}>Confirm</ControlButton>
          <ControlButton onClick={this._closePopover}>Cancel</ControlButton>
        </div>
      </div>
    );
  }

  render() {
    const { contentState, children, entityKey } = this.props;
    const { url } = contentState.getEntity(entityKey).getData();
    const toolbar = this.state.hover ? this.makeToolbar() : null;
    if (url.match(/^\w+$/)) {
      return (
        <div
          onMouseEnter={this.onMouseEnterHandler}
          onMouseLeave={this.onMouseLeaveHandler}
        >
          <div className={styles.toolbar}>{toolbar}</div>
          <ReactRouterLink
            to={url}
            className={joinClasses(
              "doc_block_inline_link",
              "doc_block_inline_link_int"
            )}
            onBlur={onBlur}
            onFocus={onFocus}
          >
            {children}
          </ReactRouterLink>
        </div>
      );
    } else {
      return (
        <a
          href={url}
          className={joinClasses(
            "doc_block_inline_link",
            "doc_block_inline_link_ext"
          )}
          onBlur={onBlur}
          onFocus={onFocus}
          onMouseEnter={this.onMouseEnterHandler}
          onMouseLeave={this.onMouseLeaveHandler}
        >
          {children}
        </a>
      );
    }
  }
}
