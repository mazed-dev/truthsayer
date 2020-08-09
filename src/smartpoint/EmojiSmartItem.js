import React from "react";

import BaseSmartItem from "./BaseSmartItem";
import Emoji from "./../Emoji";

export class EmojiSmartItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <BaseSmartItem
        replacement={this.props.emoji}
        on_insert={this.props.on_insert}
      >
        <Emoji symbol={this.props.emoji} label={this.props.label} />
        &nbsp;
        <i>{this.props.key}</i>
      </BaseSmartItem>
    );
  }
}

export default EmojiSmartItem;
