import React from "react";

import styles from "./CheckBox.module.css";

import Emoji from "./../Emoji";

import { joinClasses } from "../util/elClass.js";

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

export function CheckBox({ is_checked, onToggle, className, is_disabled }) {
  const checkmark = is_checked ? (
    <Emoji symbol={"✅"} label="checked" />
  ) : (
    <div className={styles.checkbox} />
  );
  const pointy = is_disabled ? null : styles.pointy;
  return (
    <div
      className={joinClasses(styles.container, pointy, className)}
      onClick={onToggle}
    >
      {checkmark}
    </div>
  );
}

export default CheckBox;
