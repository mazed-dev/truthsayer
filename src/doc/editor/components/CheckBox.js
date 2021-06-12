import React from 'react'

import { EditorBlock, DraftEditorBlock } from 'draft-js'

import './components.css'
import styles from './CheckBox.module.css'

import { CheckBox as ComonCheckBox } from '../../../lib/CheckBox'

import { joinClasses } from '../../../util/elClass.js'

const kCheckedAttrKey = 'checked'

export class CheckBox extends React.Component {
  // https://github.com/facebook/draft-js/issues/132
  constructor(props) {
    super(props)
    const { blockProps, block } = this.props
    const checked = block.getData().get(kCheckedAttrKey, false)
    this.state = {
      checked,
      hover: false,
    }
  }

  componentDidUpdate(prevProps) {
    const checked = this.props.block.getData().get(kCheckedAttrKey, false)
    const prevChecked = prevProps.block.getData().get(kCheckedAttrKey, false)
    if (checked !== prevChecked) {
      this.setState({ checked }) // eslint-disable-line react/no-did-update-set-state
    }
  }

  toggleChecked = (event) => {
    const { blockProps, block } = this.props
    const { updateMetadataFn, readOnly } = blockProps
    if (readOnly) {
      return
    }
    const checked = this.state.checked
    this.setState({ checked: !checked })
    updateMetadataFn(block.getKey(), {
      data: {
        [kCheckedAttrKey]: !checked,
      },
    })
  }

  onMouseEnterHandler = () => {
    this.setState({ hover: true })
  }

  onMouseLeaveHandler = () => {
    this.setState({ hover: false })
  }

  render() {
    const { offsetKey } = this.props
    const { hover, checked } = this.state
    const className = hover
      ? joinClasses(styles.check_item, styles.check_item_hover)
      : joinClasses(styles.check_item)
    return (
      <div className={className} data-offset-key={offsetKey}>
        <ComonCheckBox
          onToggle={this.toggleChecked}
          is_checked={checked}
          className={styles.checkbox}
          onMouseEnter={this.onMouseEnterHandler}
          onMouseLeave={this.onMouseLeaveHandler}
        />
        <div className={joinClasses('doc_block_inline_text', styles.block)}>
          <EditorBlock {...this.props} />
        </div>
      </div>
    )
  }
}
