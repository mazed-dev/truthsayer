import React, { useContext } from 'react'

import { withRouter, Link } from 'react-router-dom'
import { ButtonToolbar } from 'react-bootstrap'

import PropTypes from 'prop-types'

import { smugler } from './../smugler/api'

import styles from './SmallCardFootbar.module.css'

import CutTheRefImg from './../img/cut-the-ref.png'
import ImgStickyRefOff from './../img/sticky-ref-checkbox-off.png'
import ImgStickyRefOn from './../img/sticky-ref-checkbox-on.png'

import { MzdGlobalContext } from '../lib/global'
import { ImgButton } from '../lib/ImgButton'
import { HoverTooltip } from '../lib/tooltip'
import { jcss } from '../util/jcss'
import { CheckBox } from './../lib/CheckBox.js'
import {
  FootbarDropdown,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggleMeatballs,
} from './Footbar'

class PrivateSmallCardFootbarImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isSticky: this.props.edge.is_sticky,
    }
    this.toggleStickinessCancelToken = smugler.makeCancelToken()
    this.deleteEdgeCancelToken = smugler.makeCancelToken()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.edge.is_sticky !== prevProps.edge.is_sticky) {
      const { isSticky } = this.props.edge
      this.setState({ isSticky }) // eslint-disable-line react/no-did-update-set-state
    }
  }

  switchStickiness = () => {
    let { isSticky } = this.state
    isSticky = !isSticky
    smugler.edge
      .sticky({
        on: isSticky,
        eid: this.props.edge.eid,
        cancelToken: this.toggleStickinessCancelToken.token,
      })
      .then((res) => {
        const { switchStickiness, edge } = this.props
        if (res) {
          this.setState({ isSticky })
          switchStickiness(edge, isSticky)
        }
      })
  }

  handleRefCutOff = () => {
    const eid = this.props.edge.eid
    smugler.edge
      .delete({
        eid,
        cancelToken: this.deleteEdgeCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.props.cutOffRef(eid)
        }
      })
  }

  makeMenu() {
    const { nid } = this.props
    const cutTooltip = 'Cut the link'
    const { isSticky } = this.state
    const magnetTooltip = isSticky
      ? 'Demagnetise the link'
      : 'Magnetise the link'
    return (
      <FootbarDropdown>
        <FootbarDropdownToggleMeatballs id={'more-options-for-fullsize-card'} />
        <FootbarDropdownMenu>
          <FootbarDropdownItem as={Link} to={`/n/${nid}`}>
            Open
          </FootbarDropdownItem>
          <FootbarDropdownItem onClick={this.handleRefCutOff}>
            <img
              src={CutTheRefImg}
              className={jcss(styles.tool_button_img, styles.menu_item_pic)}
              alt={cutTooltip}
            />
            {cutTooltip}
          </FootbarDropdownItem>
          <FootbarDropdownItem onClick={this.switchStickiness}>
            <CheckBox checked={isSticky} />
            {magnetTooltip}
          </FootbarDropdownItem>
        </FootbarDropdownMenu>
      </FootbarDropdown>
    )
  }

  makeMagnet() {
    const { isSticky } = this.state
    const src = isSticky ? ImgStickyRefOn : ImgStickyRefOff
    const tooltip = isSticky
      ? 'This is a magnet link'
      : 'This is a not-magnet link'
    return (
      <div className={jcss(styles.tool_button, styles.toolbar_layout_item)}>
        <HoverTooltip tooltip={tooltip}>
          <img
            src={src}
            className={jcss(styles.tool_button_img)}
            alt={tooltip}
          />
        </HoverTooltip>
      </div>
    )
  }

  render() {
    const { isPublic } = this.props
    const menu = isPublic ? this.makeMagnet() : this.makeMenu()
    return (
      <ButtonToolbar className={jcss(styles.toolbar)}>{menu}</ButtonToolbar>
    )
  }
}

const PrivateSmallCardFootbar = withRouter(PrivateSmallCardFootbarImpl)

export function SmallCardFootbar({ children, edge, ...rest }) {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  const isOwned = edge.isOwnedBy(account)
  return (
    <PrivateSmallCardFootbar edge={edge} isPublic={!isOwned} {...rest}>
      {children}
    </PrivateSmallCardFootbar>
  )
}
