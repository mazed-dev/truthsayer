import React, { useContext } from "react";
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

const BLOCK_TYPES = [
  { label: "H1", style: kBlockTypeH1 },
  { label: "H2", style: kBlockTypeH2 },
  { label: "H3", style: kBlockTypeH3 },
  { label: "H4", style: kBlockTypeH4 },
  { label: "H5", style: kBlockTypeH5 },
  { label: "H6", style: kBlockTypeH6 },
  { label: "Blockquote", style: kBlockTypeQuote },
  { label: "UL", style: kBlockTypeUnorderedItem },
  { label: "OL", style: kBlockTypeOrderedItem },
  { label: "Code Block", style: kBlockTypeCode },

  { label: "Check", style: kBlockTypeUnorderedCheckItem },
  { label: "Text", style: kBlockTypeUnstyled },
];

const kToolbarKey = "blck-style-ctrl";

class BlockStyleControlsImpl extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { topbar } = this.props;
    const toolbar = this.createToolbar();
    topbar.reset(kToolbarKey, toolbar);
  }

  componentWillUnmount() {
    const { topbar } = this.props; // .topbar;
    topbar.reset(kToolbarKey);
  }

  createToolbar() {
    const { editorState, onToggle } = this.props;
    const selection = editorState.getSelection();
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
    return (
      <div>
        {BLOCK_TYPES.map((type) => (
          <ControlButton
            key={type.label}
            active={type.style === blockType}
            onToggle={onToggle}
            style={type.style}
          >
            {type.label}
          </ControlButton>
        ))}
      </div>
    );
  }

  render() {
    return (<div id={"block-style-controls"} />);
  }
};

export function BlockStyleControls({ ...rest }) {
  const ctx = useContext(MzdGlobalContext);
  return (<BlockStyleControlsImpl topbar={ctx.topbar} {...rest} />);
}
