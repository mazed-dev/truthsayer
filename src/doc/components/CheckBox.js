import React from "react";

import { EditorBlock, DraftEditorBlock } from "draft-js";

import "./components.css";

import { CheckBox as ComonCheckBox } from "../../lib/CheckBox";

import { joinClasses } from "../../util/elClass.js";

const kCheckedAttrKey = "checked";

export class CheckBox extends React.Component {
  // https://github.com/facebook/draft-js/issues/132
  constructor(props) {
    super(props);
    const { blockProps, block } = this.props;
    const checked = block.getData().get(kCheckedAttrKey, false);
    this.state = {
      checked: checked,
    };
  }

  componentDidUpdate(prevProps) {
    const checked = this.props.block.getData().get(kCheckedAttrKey, false);
    const prevChecked = prevProps.block.getData().get(kCheckedAttrKey, false);
    if (checked != prevChecked) {
      this.setState({
        checked: checked,
      });
    }
  }

  toggleChecked = (event) => {
    const { blockProps, block } = this.props;
    const { updateMetadataFn } = blockProps;
    const checked = this.state.checked;
    this.setState({ checked: !checked });
    updateMetadataFn(block.getKey(), ["data", kCheckedAttrKey], !checked);
  };

  render() {
    const { offsetKey } = this.props;
    return (
      <div className={""} data-offset-key={offsetKey}>
        <ComonCheckBox
          onToggle={this.toggleChecked}
          is_checked={this.state.checked}
        />
        <div className={"doc_component_inline_text"}>
          <EditorBlock {...this.props} />
        </div>
      </div>
    );
  }
}
