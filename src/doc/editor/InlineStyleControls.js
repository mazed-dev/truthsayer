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
import { ControlButton } from "./ControlButton";

var INLINE_STYLES = [
  { label: "Bold", style: kEntityTypeBold },
  { label: "Italic", style: kEntityTypeItalic },
  { label: "Underline", style: kEntityTypeUnderline },
  { label: "Monospace", style: kEntityTypeMonospace },
];

export function InlineStyleControls({ editorState, onToggle }) {
  const currentStyle = editorState.getCurrentInlineStyle();
  return (
    <>
      {INLINE_STYLES.map((type) => (
        <ControlButton
          key={type.label}
          active={currentStyle.has(type.style)}
          onToggle={onToggle}
          style={type.style}
        >
          {type.label}
        </ControlButton>
      ))}
    </>
  );
}
