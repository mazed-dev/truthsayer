import React, { useContext } from 'react'

import { Link } from 'react-router-dom'
import { Button, ButtonToolbar } from 'react-bootstrap'

import { smugler } from './../smugler/api'

import styles from './Footbar.module.css'

import CutTheRefImg from './../img/cut-the-ref.png'
import ImgStickyRefOff from './../img/sticky-ref-checkbox-off.png'
import ImgStickyRefOn from './../img/sticky-ref-checkbox-on.png'
import { makeRefTo } from './../lib/route'

import { MzdGlobalContext } from '../lib/global'
import { HoverTooltip } from '../lib/tooltip'
import { jcss } from '../util/jcss'
import { CheckBox } from './../lib/CheckBox.js'
import {
  FootbarDropdown,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggle,
} from './Footbar'

import { MaterialIcon, MdiOpenInFull, MdiMoreHoriz } from '../lib/MaterialIcons'

class PrivateMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isSticky: this.props.edge.is_sticky,
    }
    this.toggleStickinessCancelToken = smugler.makeCancelToken()
    this.deleteEdgeCancelToken = smugler.makeCancelToken()
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

  render() {
    const cutTooltip = 'Cut the link'
    const { isSticky } = this.state
    const magnetTooltip = isSticky
      ? 'Demagnetise the link'
      : 'Magnetise the link'
    const { className, children } = this.props
    return (
      <FootbarDropdown>
        <FootbarDropdownToggle
          id={'more-options-for-fullsize-card'}
          className={className}
        >
          {children}
        </FootbarDropdownToggle>
        <FootbarDropdownMenu>
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
}

const PublicMenu = ({ children, edge }) => {
  const { isSticky } = edge
  const src = isSticky ? ImgStickyRefOn : ImgStickyRefOff
  const tooltip = isSticky
    ? 'This is a magnet link'
    : 'This is a not-magnet link'
  return (
    <div className={jcss(styles.tool_button, styles.toolbar_layout_item)}>
      <HoverTooltip tooltip={tooltip}>{children}</HoverTooltip>
    </div>
  )
}

const Menu = ({
  children,
  className,
  edge,
  switchStickiness,
  cutOffRef,
  isOwned,
}) => {
  if (isOwned) {
    return (
      <PrivateMenu
        edge={edge}
        switchStickiness={switchStickiness}
        cutOffRef={cutOffRef}
        className={jcss(styles.tool_button, styles.toolbar_layout_item)}
      >
        {children}
      </PrivateMenu>
    )
  } else {
    return <PublicMenu edge={edge}>{children}</PublicMenu>
  }
}

const SeeMoreButton = React.forwardRef(
  ({ children, onClick, className, disabled }, ref) => {
    return (
      <div
        className={jcss(styles.a_see_more, className)}
        ref={ref}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </div>
    )
  }
)

export function SmallCardFootbar({
  nid,
  edge,
  showMore,
  toggleMore,
  switchStickiness,
  cutOffRef,
}) {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  const isOwned = edge.isOwnedBy(account)
  return (
    <ButtonToolbar className={jcss(styles.toolbar)}>
      <Button
        as={SeeMoreButton}
        onClick={toggleMore}
        className={jcss(styles.tool_button, styles.toolbar_layout_item)}
      >
        <MaterialIcon type={showMore ? 'expand_less' : 'expand_more'} />
      </Button>
      <Button
        as={Link}
        to={makeRefTo.node(nid)}
        className={jcss(styles.tool_button, styles.toolbar_layout_item)}
      >
        <MdiOpenInFull />
      </Button>
      <Menu
        edge={edge}
        switchStickiness={switchStickiness}
        cutOffRef={cutOffRef}
        className={jcss(styles.tool_button, styles.toolbar_layout_item)}
        isOwned={isOwned}
      >
        <MdiMoreHoriz />
      </Menu>
    </ButtonToolbar>
  )
}
