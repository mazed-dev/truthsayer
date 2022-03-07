/** @jsxImportSource @emotion/react */

import React, { useContext } from 'react'
import { css } from '@emotion/react'
import { Link } from 'react-router-dom'
import { Button } from 'react-bootstrap'

import { smuggler } from 'smuggler-api'

import styles from './Footbar.module.css'

import { makeRefTo } from './../lib/route'

import { MzdGlobalContext } from '../lib/global'
import { HoverTooltip } from '../lib/tooltip'
import { CheckBox } from './../lib/CheckBox'
import {
  FootbarDropdown,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggle,
} from './Footbar'

import {
  jcss,
  MaterialIcon,
  MdiLaunch,
  MdiMoreHoriz,
  MdiContentCut,
} from 'elementary'
import { log } from 'armoury'

class PrivateMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isSticky: this.props.edge.is_sticky,
    }
    this.toggleStickinessAbortController = new AbortController()
    this.deleteEdgeAbortController = new AbortController()
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
    smuggler.edge
      .sticky({
        on: isSticky,
        eid: this.props.edge.eid,
        signal: this.toggleStickinessAbortController.signal,
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
    smuggler.edge
      .delete({
        eid,
        signal: this.deleteEdgeAbortController.signal,
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
      <FootbarDropdown className={this.props.className}>
        <FootbarDropdownToggle id={'more-options-for-fullsize-card'}>
          {children}
        </FootbarDropdownToggle>
        <FootbarDropdownMenu>
          <FootbarDropdownItem onClick={this.handleRefCutOff}>
            <MdiContentCut css={{ fontSize: '20px' }} />
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

const PublicMenu = ({ children, edge, className }) => {
  const { isSticky } = edge
  const tooltip = isSticky
    ? 'This is a magnet link'
    : 'This is a not-magnet link'
  return (
    <div className={jcss(styles.tool_button, className)}>
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
        className={jcss(styles.tool_button, className)}
      >
        {children}
      </PrivateMenu>
    )
  } else {
    return (
      <PublicMenu edge={edge} className={jcss(styles.tool_button, className)}>
        {children}
      </PublicMenu>
    )
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
  log.debug('SmallCardFootbar isOwnedBy', isOwned, account)
  return (
    <div
      css={css`
        width: 100%;
        display: flex;
        justify-content: space-between;
      `}
    >
      <Button
        as={SeeMoreButton}
        onClick={toggleMore}
        className={jcss(styles.tool_button)}
      >
        <MaterialIcon
          css={{ fontSize: '20px' }}
          type={showMore ? 'expand_less' : 'expand_more'}
        />
      </Button>
      <Button
        as={Link}
        to={makeRefTo.node(nid)}
        className={jcss(styles.tool_button)}
      >
        <MdiLaunch css={{ fontSize: '20px' }} />
      </Button>
      <Menu
        edge={edge}
        switchStickiness={switchStickiness}
        cutOffRef={cutOffRef}
        className={jcss(styles.tool_button)}
        isOwned={isOwned}
      >
        <MdiMoreHoriz css={{ fontSize: '20px' }} />
      </Menu>
    </div>
  )
}
