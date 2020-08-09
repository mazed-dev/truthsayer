import React from "react";

import moment from "moment";

import BaseSmartItem from "./BaseSmartItem";

import { MdSmallCardRender } from "./../MarkDownRender";

export function extractRefSearcToken(input) {
  var token = input;
  var direction = null;
  const prefTo = input.match(/^(refe?r?e?n?c?e?|to|next) /i);
  if (prefTo) {
    const pref = prefTo[0];
    token = input.slice(pref.length);
      direction = "to";
  } else {
    const prefFrom = input.match(/^(from|prev?i?o?u?s?) /i);
    if (prefFrom) {
      const pref = prefFrom[0];
      token = input.slice(pref.length);
      direction = "from";
    }
  }
  return {
    token: token,
    direction: direction,
  };
}

export class RefSmartItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var title = this.props.preface.match(/^.*/);
    if (title) {
      title = title[0];
      if (title.length === 0) {
        title = "ref";
      }
    } else {
      title = "ref";
    }
    title = title.replace(/^[# ]+/, "");
    const replacement = "[" + title + "](" + this.props.nid + ")";
    const upd = moment.unix(this.props.upd).fromNow();
    return (
      <BaseSmartItem
        replacement={replacement}
        on_insert={this.props.on_insert}
      >
        <MdSmallCardRender source={this.props.preface + "&hellip;"} />
        <small className="text-muted">
          <i>Updated {upd}</i>
        </small>
      </BaseSmartItem>
    );
  }
}

export default RefSmartItem;
