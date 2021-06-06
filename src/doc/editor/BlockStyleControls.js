import React, { useState } from "react";
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
  kBlockTypeOrderedItem,
  kBlockTypeQuote,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeUnorderedItem,
  kBlockTypeUnstyled,
} from "../types.jsx";

import IconOrderedList from "./img/icon-ordered-list-strip.svg";
import IconUnorderedList from "./img/icon-unordered-list-strip.svg";
import IconCheckList from "./img/icon-check-list-strip.svg";
import IconCode from "./img/icon-code-strip.svg";

import styles from "./BlockStyleControls.module.css";
import "./components/components.css";
import { getBlockStyle, getBlockName } from "./components/BlockStyle";

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

function ButtonForType({ type, onToggle, blockType, onSelect, className }) {
  className = joinClasses(className, styles.dropdown_item);
  const isActive = type === blockType;
  if (isActive) {
    className = joinClasses(className, styles.dropdown_item_active);
  }
  const handleSelect = () => {
    onToggle(type);
    onSelect();
  };
  return (
    <Dropdown.Item key={type} onSelect={handleSelect} className={className}>
      <div className={getBlockStyle(type)}>
        {getBlockIcon(type)}
        {getBlockName(type)}
      </div>
    </Dropdown.Item>
  );
}

export function BlockStyleControls({ editorState, onToggle, className }) {
  const [show, setShow] = useState(false);
  const showDropdown = (e) => {
    setShow(!show);
  };
  const hideDropdown = () => {
    setShow(false);
  };
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  className = joinClasses(className, styles.select_dropdown);
  return (
    <Dropdown
      as={ButtonGroup}
      className={className}
      drop={"down"}
      show={show}
      onMouseLeave={hideDropdown}
    >
      <Dropdown.Toggle
        id="dropdown-block-style-selection"
        variant={"light"}
        className={styles.dropdown_toggle}
        onClick={showDropdown}
      >
        {getBlockIcon(blockType)}
        {getBlockName(blockType)}
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.dropdown_menu}>
        {BLOCK_TYPES.map((type) => (
          <ButtonForType
            type={type}
            onToggle={onToggle}
            blockType={blockType}
            onSelect={hideDropdown}
            key={type}
          />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
