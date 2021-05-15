import React, { useContext } from "react";
import { Dropdown } from "react-bootstrap";
import {
  kBlockTypeAtomic,
  kBlockTypeCode,
  kBlockTypeH1,
  kBlockTypeH2,
  kBlockTypeH3,
  kBlockTypeH4,
  kBlockTypeH5,
  kBlockTypeH6,
  kBlockTypeHrule,
  kBlockTypeOrderedItem,
  kBlockTypeQuote,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeUnorderedItem,
  kBlockTypeUnstyled,
} from "../types.jsx";

import { MzdGlobalContext } from "../../lib/global";
import { ControlButton } from "./ControlButton";

import IconOrderedList from "./img/icon-ordered-list-strip.svg";
import IconUnorderedList from "./img/icon-unordered-list-strip.svg";
import IconCheckList from "./img/icon-check-list-strip.svg";
import IconCode from "./img/icon-code-strip.svg";

import styles from "./BlockStyleControls.module.css";
import "./BlockStyleControls.css";
import "../components/components.css";
import { getBlockStyle, getBlockName } from "../components/BlockStyle";

const BLOCK_TYPES = [
  kBlockTypeUnstyled,
  kBlockTypeH1,
  kBlockTypeH2,
  kBlockTypeH3,
  kBlockTypeUnorderedItem,
  kBlockTypeOrderedItem,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeCode,
  kBlockTypeQuote,
  kBlockTypeH4,
  kBlockTypeH5,
  kBlockTypeH6,
];

const BLOCK_ICONS = {
  // [kBlockTypeQuote]: "Quote",
  [kBlockTypeUnorderedItem]: IconUnorderedList,
  [kBlockTypeOrderedItem]: IconOrderedList,
  [kBlockTypeUnorderedCheckItem]: IconCheckList,
  [kBlockTypeCode]: IconCode,
};

function ButtonForType({ type, onToggle, blockType }) {
  let icon = BLOCK_ICONS[type];
  if (icon) {
    icon = <img className={styles.icon_img} src={icon} />;
  }
  return (
    <Dropdown.Item
      as={ControlButton}
      key={type}
      active={type === blockType}
      onToggle={onToggle}
      style={type}
      className={styles.dropdown_item}
    >
      <div className="checkmark_container">
        <div className="checkmark" />
      </div>
      <div className={getBlockStyle(type)}>
        {icon}
        {getBlockName(type)}
      </div>
    </Dropdown.Item>
  );
}

export function BlockStyleControls({ editorState, onToggle }) {
  // const { editorState, onToggle } = this.props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  return (
    <Dropdown navbar>
      <Dropdown.Toggle
        className={styles.dropdown_toggle}
        id="dropdown-basic"
        variant={"light"}
      >
        {getBlockName(blockType)}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {BLOCK_TYPES.map((type) => (
          <ButtonForType
            type={type}
            onToggle={onToggle}
            blockType={blockType}
          />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
