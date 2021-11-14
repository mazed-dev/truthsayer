import React from 'react'
import PropTypes from 'prop-types'
import { Link, NavLink } from 'react-router-dom'

import { Badge } from 'react-bootstrap'

import moment from 'moment'

import './MarkdownRender.css'
import styles from './MarkdownList.module.css'

// https://github.com/rexxars/react-markdown
import { ReactMarkdown } from 'react-markdown'
import { Emoji } from './../lib/Emoji'

import { MdCheckBox } from './MdCheckBox'
import { MzdLink } from './../lib/MzdLink'

import { jcss } from 'elementary'

export function HeaderOne({ children, ...rest }) {
  return (
    <span className={styles.full_h1} {...rest}>
      {children}
    </span>
  )
}

export function HeaderTwo({ children, ...rest }) {
  return (
    <span className={styles.full_h2} {...rest}>
      {children}
    </span>
  )
}

export function HeaderThree({ children, ...rest }) {
  return (
    <span className={styles.full_h3} {...rest}>
      {children}
    </span>
  )
}

export function HeaderFour({ children, ...rest }) {
  return (
    <span className={styles.full_h4} {...rest}>
      {children}
    </span>
  )
}

export function HeaderFive({ children, ...rest }) {
  return (
    <span className={styles.full_h5} {...rest}>
      {children}
    </span>
  )
}

export function HeaderSix({ children, ...rest }) {
  return (
    <span className={styles.full_h6} {...rest}>
      {children}
    </span>
  )
}

function MarkdownHeading(nid) {
  return ({ level, children, sourcePosition, ...rest }) => {
    let hdr_el
    // TODO(akindyakov): add markdown title anchors
    switch (level) {
      case 1:
        hdr_el = (
          <h1 className={styles.full_h1} {...rest}>
            {children}
          </h1>
        )
        break
      case 2:
        hdr_el = (
          <h2 className={styles.full_h2} {...rest}>
            {children}
          </h2>
        )
        break
      case 3:
        hdr_el = (
          <h3 className={styles.full_h3} {...rest}>
            {children}
          </h3>
        )
        break
      case 4:
        hdr_el = (
          <h4 className={styles.full_h4} {...rest}>
            {children}
          </h4>
        )
        break
      case 5:
        hdr_el = (
          <h5 className={styles.full_h5} {...rest}>
            {children}
          </h5>
        )
        break
      case 6:
      default:
        hdr_el = (
          <h6 className={styles.full_h6} {...rest}>
            {children}
          </h6>
        )
        break
    }
    return hdr_el
  }
}

function MarkdownSmallHeading(nid) {
  return ({ level, children, sourcePosition, ...rest }) => {
    let hdr_el
    // TODO(akindyakov): add markdown title anchors
    switch (level) {
      case 1:
        hdr_el =
          nid != null ? (
            <NavLink
              className={jcss(styles.small_h1, styles.small_ref)}
              {...rest}
              to={`/n/${nid}`}
            >
              {children}
            </NavLink>
          ) : (
            <h1 className={styles.small_h1} {...rest}>
              {children}
            </h1>
          )
        break
      case 2:
        hdr_el =
          nid != null ? (
            <NavLink
              className={jcss(styles.small_h2, styles.small_ref)}
              {...rest}
              to={`/n/${nid}`}
            >
              {children}
            </NavLink>
          ) : (
            <h2 className={styles.small_h2} {...rest}>
              {children}
            </h2>
          )
        break
      case 3:
        hdr_el =
          nid != null ? (
            <NavLink
              className={jcss(styles.small_h4, styles.small_ref)}
              {...rest}
              to={`/n/${nid}`}
            >
              {children}
            </NavLink>
          ) : (
            <h3 className={styles.small_h3} {...rest}>
              {children}
            </h3>
          )
        break
      case 4:
        hdr_el =
          nid != null ? (
            <NavLink
              className={jcss(styles.small_h4, styles.small_ref)}
              {...rest}
              to={`/n/${nid}`}
            >
              {children}
            </NavLink>
          ) : (
            <h4 className={styles.small_h4} {...rest}>
              {children}
            </h4>
          )
        break
      case 5:
        hdr_el =
          nid != null ? (
            <NavLink
              className={jcss(styles.small_h5, styles.small_ref)}
              {...rest}
              to={`/n/${nid}`}
            >
              {children}
            </NavLink>
          ) : (
            <h5 className={styles.small_h5} {...rest}>
              {children}
            </h5>
          )
        break
      case 6:
      default:
        hdr_el =
          nid != null ? (
            <NavLink
              className={jcss(styles.small_h6, styles.small_ref)}
              {...rest}
              to={`/n/${nid}`}
            >
              {children}
            </NavLink>
          ) : (
            <h6 className={styles.small_h6} {...rest}>
              {children}
            </h6>
          )
        break
    }
    return hdr_el
  }
}

export class DateBadge extends React.Component {
  handleClick = (event) => {}

  render() {
    const date_str = this.props.tm.calendar({
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: 'dddd',
      lastDay: '[Yesterday]',
      lastWeek: '[Last] dddd',
      sameElse: 'YYYY MMMM DD, dddd',
    })
    return (
      <Badge bg="secondary" pill>
        {date_str}
      </Badge>
    )
  }
}

export class TimeBadge extends React.Component {
  handleClick = (event) => {}

  render() {
    let date_str
    if (!this.props.format || this.props.format === 'time') {
      const timeFmt = ', hh:mm'
      date_str = this.props.tm.calendar({
        sameDay: `[Today]${timeFmt}`,
        nextDay: `[Tomorrow]${timeFmt}`,
        nextWeek: `dddd${timeFmt}`,
        lastDay: `[Yesterday]${timeFmt}`,
        lastWeek: `[Last] dddd${timeFmt}`,
        sameElse: `YYYY MMMM DD, dddd${timeFmt}`,
      })
    } else {
      date_str = this.props.tm.format(this.props.format)
    }
    return (
      <Badge bg="secondary" pill>
        {date_str}
      </Badge>
    )
  }
}

TimeBadge.propTypes = {
  format: PropTypes.string,
}

export function DateTimeBadge({ tm, format, children, ...rest }) {
  if (format === 'day') {
    return <DateBadge tm={tm} />
  }
  return <TimeBadge tm={tm} format={format} />
}

function MarkdownLink({ href, children, sourcePosition, ...rest }) {
  href = href.trim()

  const prefix = null
  let is_external = false
  let is_note = false
  if (href.startsWith('@')) {
    const parts = href.match(/^@(-?[0-9]+)\/?(.*)/)
    if (parts) {
      const tm = moment.unix(parts[1])
      const format = parts[2]
      return <DateTimeBadge tm={tm} format={format} />
    }
  } else if (href.match(/^\w+$/)) {
    // Link to one of the nodes
    is_note = true
  } else {
    // External link
    is_external = true
  }

  return (
    <MzdLink
      to={href}
      className={styles.inline_ref}
      is_external={is_external}
      is_note={is_note}
      {...rest}
    >
      {children}
    </MzdLink>
  )
}

function MarkdownText({ children, sourcePosition, ...rest }) {
  return <>{children}</>
}

function MarkdownParagraph({ children, sourcePosition, ...rest }) {
  return <p className={styles.full_paragraph}>{children}</p>
}

function MarkdownSmallParagraph({ children, sourcePosition, ...rest }) {
  return <p className={styles.small_paragraph}>{children}</p>
}

const _LIST_POINT_OPTIONS = [
  <Emoji symbol="&#8226;" label="*" />,
  <Emoji symbol="&#9702;" label="-" />,
  <Emoji symbol="&#x25c7;" label="*" />,
  <Emoji symbol="&#9658;" label="-" />,
  <Emoji symbol="&#9659;" label="*" />,
  <Emoji symbol="&#9656;" label="-" />,
  <Emoji symbol="&#9657;" label="*" />,
  <Emoji symbol="&#9679;" label="-" />,
  <Emoji symbol="&#9655;" label="-" />,
  <Emoji symbol="&#9675;" label="-" />,
  <Emoji symbol="&#9673;" label="-" />,
  <Emoji symbol="&#9678;" label="-" />,
  <Emoji symbol="&#9677;" label="-" />,
  <Emoji symbol="&#9676;" label="-" />,
  <Emoji symbol="&#x233e;" label="-" />,
]

function genListPointStyle(sourcePosition) {
  let startColumn = sourcePosition.start.column - 1
  startColumn = startColumn < 0 ? 0 : startColumn
  const depth = Math.floor(startColumn / 2)
  const i = depth % _LIST_POINT_OPTIONS.length
  // console.log("startColumn", startColumn, depth);
  return _LIST_POINT_OPTIONS[i]
}

function MarkdownList({ children, ordered, start, depth, ...rest }) {
  if (ordered) {
    return (
      <ol start={start} className={styles.ordered_list}>
        {children}
      </ol>
    )
  }
  return <ul className={styles.unordered_list}>{children}</ul>
}

function isEmoji(ch) {
  return (
    (ch > '\u{1f150}' && ch < '\u{1fadf}') || // emoji
    (ch > '\u{2190}' && ch < '\u{21ff}') || // arrows
    (ch > '\u{2300}' && ch < '\u{23ff}') || // technical
    (ch > '\u{2460}' && ch < '\u{24ff}') || // enclosed alphanymerics
    (ch > '\u{2580}' && ch < '\u{27ff}') || // block elements
    (ch > '\u{2900}' && ch < '\u{29d7}') || // arrows
    (ch > '\u{2b12}' && ch < '\u{2bd2}') || // symbols and arrows
    (ch > '\u{10080}' && ch < '\u{100fa}') || // Linear B ideograms
    (ch > '\u{101d0}' && ch < '\u{101fc}') || // Ancient symbols
    (ch > '\u{203b}' && ch < '\u{205c}') // Greek extended
  )
}

function tryToMakeEmojiListItem(elements) {
  if (elements.length > 0 && elements[0].props && elements[0].props.value) {
    const value = elements[0].props.value.trim()
    const ch = value.split(' ', 1)[0]
    if (isEmoji(ch)) {
      const suff = value.slice(ch.length).trim()
      const firstKid = MarkdownText({
        children: suff,
        sourcePosition: {},
      })
      elements.shift()
      return (
        <>
          <div className={styles.emoji_list_item_before}>{ch}</div>
          <li className={styles.unordered_list_item}>
            {firstKid} {elements}
          </li>
        </>
      )
    }
  }
  return null
}

function MarkdownListItem(source, update) {
  return ({ children, ordered, index, sourcePosition, checked, ...rest }) => {
    const checkbox =
      checked == null ? null : (
        <MdCheckBox
          is_checked={checked}
          className={styles.unordered_list_item_before}
          sourcePosition={sourcePosition}
          source={source}
          update={update}
        />
      )
    if (ordered) {
      return (
        <li className={styles.ordered_list_item}>
          {checkbox}
          {children}
        </li>
      )
    }
    if (checkbox != null) {
      return (
        <>
          {checkbox}
          <li className={styles.unordered_list_item}> {children} </li>
        </>
      )
    }
    const emojiListItem = tryToMakeEmojiListItem(children)
    if (emojiListItem) {
      return emojiListItem
    }
    const pt = genListPointStyle(sourcePosition)
    return (
      <>
        <div className={styles.unordered_list_item_before}> {pt} </div>
        <li className={styles.unordered_list_item}> {children} </li>
      </>
    )
  }
}

export function MdCardRender({ source, nid, update }) {
  return (
    <ReactMarkdown
      source={source}
      rawSourcePos
      renderers={{
        heading: MarkdownHeading(nid),
        text: MarkdownText,
        paragraph: MarkdownParagraph,
        link: MarkdownLink,
        list: MarkdownList,
        listItem: MarkdownListItem(source, update),
        root: MarkdownRoot,
      }}
    />
  )
}

function MarkdownRoot({ children, sourcePosition, ...rest }) {
  return (
    <div
      className={jcss(
        'markdown-body',
        'markdown-full-note-body',
        styles.full_paragraph
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

function MarkdownSmallRoot({ children, sourcePosition, ...rest }) {
  return (
    <div
      className={jcss(
        'markdown-body',
        'markdown-small-card-body',
        styles.small_paragraph
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function MdSmallCardRender({ source, nid }) {
  return (
    <ReactMarkdown
      source={source}
      rawSourcePos
      renderers={{
        heading: MarkdownSmallHeading(nid),
        text: MarkdownText,
        paragraph: MarkdownSmallParagraph,
        link: MarkdownLink,
        list: MarkdownList,
        listItem: MarkdownListItem(null, null),
        root: MarkdownSmallRoot,
      }}
    />
  )
}

export function SmallAsterisk({ nid, children, ...rest }) {
  if (!children) {
    children = '🌿'
  }
  return (
    <div className={styles.asterisk}>
      <NavLink
        className={jcss(styles.small_h1, styles.small_ref)}
        {...rest}
        to={`/n/${nid}`}
      >
        {children}
      </NavLink>
    </div>
  )
}

export function renderMdCard({ source, nid, update }) {
  return <MdCardRender source={source} nid={nid} update={update} />
}

export function renderMdSmallCard({ source, nid }) {
  return <MdSmallCardRender source={source} nid={nid} />
}

export default MdCardRender
