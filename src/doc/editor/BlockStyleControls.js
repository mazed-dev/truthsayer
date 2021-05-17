import React, { useContext } from "react";
import { Dropdown, ButtonGroup } from "react-bootstrap";
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
import { ToggleControlButton } from "./ControlButton";

import IconOrderedList from "./img/icon-ordered-list-strip.svg";
import IconUnorderedList from "./img/icon-unordered-list-strip.svg";
import IconCheckList from "./img/icon-check-list-strip.svg";
import IconCode from "./img/icon-code-strip.svg";

import styles from "./BlockStyleControls.module.css";
import "./BlockStyleControls.css";
import "../components/components.css";
import { getBlockStyle, getBlockName } from "../components/BlockStyle";

import { joinClasses } from "../../util/elClass.js";

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
  // [kBlockTypeCode]: IconCode,
};

function getBlockIcon(blockType) {
  let icon = BLOCK_ICONS[blockType];
  if (icon) {
    return <img className={styles.icon_img} src={icon} />;
  }
  return null;
}

function ButtonForType({ type, onToggle, blockType }) {
  return (
    <Dropdown.Item
      as={ToggleControlButton}
      key={type}
      isActive={type === blockType}
      onToggle={onToggle}
      style={type}
      className={styles.dropdown_item}
    >
      <div className={getBlockStyle(type)}>
        {getBlockIcon(type)}
        {getBlockName(type)}
      </div>
    </Dropdown.Item>
  );
}

export function BlockStyleControls({ editorState, onToggle, className }) {
  // const { editorState, onToggle } = this.props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  className = joinClasses(className, styles.select_dropdown);
  return (
    <Dropdown className={className} as={ButtonGroup} drop={"down"}>
      <Dropdown.Toggle id="dropdown-block-style-selection" variant={"light"}>
        {getBlockIcon(blockType)}
        {getBlockName(blockType)}
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.dropdown_menu}>
        {BLOCK_TYPES.map((type) => (
          <ButtonForType
            type={type}
            onToggle={onToggle}
            blockType={blockType}
            key={type}
          />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
