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

const kToolbarKey = "in-style-ctrl";

class InlineStyleControlsImpl extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { topbar } = this.props;
    const toolbar = this.createToolbar();
    topbar.reset(kToolbarKey, toolbar);
  }

  componentWillUnmount() {
    const { topbar } = this.props;
    topbar.reset(kToolbarKey);
  }

  createToolbar() {
    const { editorState, onToggle } = this.props;
    const currentStyle = editorState.getCurrentInlineStyle();
    return (
      <div>
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
      </div>
    );
  }

  render() {
    return (<div id={"inline-style-controls"} />);
  }
};

export function InlineStyleControls({ ...rest }) {
  const ctx = useContext(MzdGlobalContext);
  return (<InlineStyleControlsImpl topbar={ctx.topbar} {...rest} />);
}
