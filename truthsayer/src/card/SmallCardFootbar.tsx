/** @jsxImportSource @emotion/react */
// @ts-nocheck

import React, { useContext } from 'react'
import { css } from '@emotion/react'

import { smuggler, TEdge, TNodeUtil } from 'smuggler-api'

import styles from './Footbar.module.css'

import { MzdGlobalContext } from '../lib/global'
import {
  FootbarDropdown,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggle,
} from './Footbar'

import {
  jcss,
  CheckBox,
  MdiMoreHoriz,
  HoverTooltip,
  MdiContentCut,
} from 'elementary'

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
      <FootbarDropdown className={className}>
        <FootbarDropdownToggle id={'more-options-for-fullsize-card'}>
          {children}
        </FootbarDropdownToggle>
        <FootbarDropdownMenu>
          <FootbarDropdownItem onClick={this.handleRefCutOff}>
            <MdiContentCut
              css={{
                fontSize: '20px',
                verticalAlign: 'middle',
                marginRight: '5px',
              }}
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

export function SmallCardFootbar({
  edge,
  switchStickiness,
  cutOffRef,
  className,
}: {
  nid: string
  edge: TEdge
  switchStickiness: (edge: TEdge, on: boolean) => void
  cutOffRef: (eid: string) => void
  className?: string
}) {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  const isOwned = TNodeUtil.isOwnedBy(edge, account)
  return (
    <div
      css={css`
        width: 100%;
        display: flex;
        justify-content: space-between;
      `}
      className={className}
    >
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
