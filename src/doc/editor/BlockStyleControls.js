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

import styles from "./BlockStyleControls.module.css";
import "../components/components.css";
import { getBlockStyle, getBlockName } from "../components/BlockStyle";

const BLOCK_TYPES = [
  kBlockTypeH1,
  kBlockTypeH2,
  kBlockTypeH3,
  kBlockTypeUnorderedItem,
  kBlockTypeOrderedItem,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeCode,
  kBlockTypeQuote,
  kBlockTypeUnstyled,
  kBlockTypeH4,
  kBlockTypeH5,
  kBlockTypeH6,
];

const BLOCK_UNAMES = {
  [kBlockTypeH1]: "Header 1",
  [kBlockTypeH2]: "Header 2",
  [kBlockTypeH3]: "Header 3",
  [kBlockTypeH4]: "Header 4",
  [kBlockTypeH5]: "Header 5",
  [kBlockTypeH6]: "Header 6",
  [kBlockTypeQuote]: "Quote",
  [kBlockTypeUnorderedItem]: "Bullet list",
  [kBlockTypeOrderedItem]: "Numbered list",
  [kBlockTypeCode]: "Code",
  [kBlockTypeUnorderedCheckItem]: "Check list",
  [kBlockTypeUnstyled]: "Text",
};

export function BlockStyleControls({ editorState, onToggle }) {
  // const { editorState, onToggle } = this.props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  return (
    <Dropdown className={styles.dropdown}>
      <Dropdown.Toggle className={styles.dropdown_toggle} id="dropdown-basic">
        {BLOCK_UNAMES[blockType]}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {BLOCK_TYPES.map((type) => (
          <Dropdown.Item
            as={ControlButton}
            key={type}
            active={type === blockType}
            onToggle={onToggle}
            style={type}
            className={styles.dropdown_item}
          >
            <div className={getBlockStyle(type)}>{getBlockName(type)}</div>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
