import React from 'react'

import styles from './AuthorBadge.module.css'

import { smuggler } from 'smuggler-api'

import { HoverTooltip } from 'elementary'

import UserDefaultPic from './../auth/img/user-default-pic.png'

export class AuthorBadge extends React.Component {
  constructor(props) {
    super(props)
    this.state = { badge: null }
    this.fetchBadgeAbortController = new AbortController()
  }

  // static contextType = MzdGlobalContext;

  componentDidMount() {
    if (!this.state.badge) {
      this.fetchBadge()
    }
  }

  componentWillUnmount() {
    this.fetchBadgeAbortController.abort()
  }

  componentDidUpdate(prevProps) {
    if (this.props.uid !== prevProps.uid) {
      this.fetchBadge()
    }
  }

  fetchBadge() {
    const uid = this.props.uid
    if (uid) {
      smuggler.user.badge
        .get({
          uid,
          signal: this.fetchBadgeAbortController.signal,
        })
        .then((badge) => {
          if (badge) {
            this.setState({ badge })
          }
        })
    }
  }

  render() {
    const badge = this.state.badge
    const photo = badge && badge.photo ? badge.photo : UserDefaultPic
    const name = badge && badge.name ? badge.name : null
    return (
      <div className={styles.badge}>
        <div className={styles.column}>
          <img src={photo} className={styles.user_pic_image} alt={'user'} />
        </div>
        <div className={styles.column}>
          <div className={styles.user_name}>{name}</div>
          <div className={styles.created_at_date}>
            {this.props.created_at.fromNow()}
          </div>
        </div>
      </div>
    )
  }
}

function formatDate(m) {
  const sameElse = function (now) {
    if (this.year() === now.year()) {
      return 'dddd, D MMM'
    } else {
      return 'dddd, D MMM YYYY'
    }
  }
  return m.calendar({
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse,
  })
}

function formatFullDate(m) {
  return m.format('dddd, MMMM Do YYYY, HH:mm')
}

export const TimeBadge = ({ created_at, updated_at }) => {
  let tooltip = `Created ${formatFullDate(created_at)}`
  if (!created_at.isSame(updated_at)) {
    tooltip += `, updated ${formatFullDate(updated_at)}`
  }
  return (
    <div className={styles.badge}>
      <div className={styles.column}>
        <HoverTooltip tooltip={tooltip}>
          <div className={styles.created_at_date}>{formatDate(created_at)}</div>
        </HoverTooltip>
      </div>
    </div>
  )
}

export class AuthorFooter extends React.Component {
  // static contextType = MzdGlobalContext;
  render() {
    const node = this.props.node
    if (!node) {
      return null
    }
    const account = this.context.account
    if (account && node.isOwnedBy(account)) {
      return (
        <footer className={styles.author_footer}>
          <TimeBadge
            created_at={node.created_at}
            updated_at={node.updated_at}
          />
        </footer>
      )
    }
    return (
      <footer className={styles.author_footer}>
        <AuthorBadge created_at={node.created_at} uid={node.getOwner()} />
      </footer>
    )
  }
}
