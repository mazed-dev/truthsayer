import React from "react";

import { CheckBox } from "./../lib/CheckBox.js";

// Unordered
const kCheckedRe = /(^ *([*\-+]|[0-9]+\.) *)\[x\]/i;
const kUncheckedRe = /(^ *([*\-+]|[0-9]+\.) *)\[ \]/i;
const kToUnchecked = "$1[ ]";
const kToChecked = "$1[x]";

export function tickCheckbox(sourceLine) {
  return sourceLine.replace(kUncheckedRe, kToChecked);
}

export function untickCheckbox(sourceLine) {
  return sourceLine.replace(kCheckedRe, kToUnchecked);
}

export class MdCheckBox extends React.Component {
  onToggle = () => {
    // sourcePosition: {
    //   start: { line: 5, column: 1, offset: 168 }
    //   end: { line: 5, column: 51, offset: 218 }
    // }
    // console.log("Source position -> ", this.props.sourcePosition);
    //
    if (this.props.update) {
      const pref = this.props.source.slice(
        0,
        this.props.sourcePosition.start.offset
      );
      const suf = this.props.source.slice(this.props.sourcePosition.end.offset);
      const mod = this.props.is_checked ? untickCheckbox : tickCheckbox;
      const newValue = mod(
        this.props.source.slice(
          this.props.sourcePosition.start.offset,
          this.props.sourcePosition.end.offset
        )
      );
      this.props.update(pref + newValue + suf);
    }
  };

  render() {
    return (
      <CheckBox
        is_checked={this.props.is_checked}
        onToggle={this.onToggle}
        className={this.props.className}
      />
    );
  }
}

export default MdCheckBox;
