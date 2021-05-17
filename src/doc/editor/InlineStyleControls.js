import React, { useContext } from "react";
import {
  kEntityTypeBold,
  kEntityTypeItalic,
  kEntityTypeLink,
  kEntityTypeMonospace,
  kEntityTypeTime,
  kEntityTypeUnderline,
  kEntityTypeImage,
} from "../types.jsx";

import { MzdGlobalContext } from "../../lib/global";
import { ToggleControlButton } from "./ControlButton";

import { joinClasses } from "../../util/elClass.js";

import styles from "./InlineStyleControls.module.css";

export function InlineStyleControls({
  editorState,
  onToggle,
  onStateChange,
  className,
}) {
  const currentStyle = editorState.getCurrentInlineStyle();
  return (
    <>
      <ToggleControlButton
        key={"bold"}
        isActive={currentStyle.has(kEntityTypeBold)}
        onToggle={onToggle}
        style={kEntityTypeBold}
        className={joinClasses(styles.btn, styles.btn_bold, className)}
      >
        {"B"}
      </ToggleControlButton>
      <ToggleControlButton
        key={"italic"}
        isActive={currentStyle.has(kEntityTypeItalic)}
        onToggle={onToggle}
        style={kEntityTypeItalic}
        className={joinClasses(styles.btn, styles.btn_italic, className)}
      >
        {"I"}
      </ToggleControlButton>
      <ToggleControlButton
        key={"underline"}
        isActive={currentStyle.has(kEntityTypeUnderline)}
        onToggle={onToggle}
        style={kEntityTypeUnderline}
        className={joinClasses(styles.btn, styles.btn_underline, className)}
      >
        {"U"}
      </ToggleControlButton>
      <ToggleControlButton
        key={"monospace"}
        isActive={currentStyle.has(kEntityTypeMonospace)}
        onToggle={onToggle}
        style={kEntityTypeMonospace}
        className={joinClasses(styles.btn, styles.btn_monospace, className)}
      >
        {"<>"}
      </ToggleControlButton>
    </>
  );
}
