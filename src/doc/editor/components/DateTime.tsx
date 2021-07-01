import React from 'react'

import { useSelected, useFocused } from 'slate-react'

import { Badge } from 'react-bootstrap'

import moment from 'moment'

import { jcss } from '../../../util/jcss'
import { Optional } from '../../../util/types'
import { debug } from '../../../util/log'

import './components.css'

import styles from './DateTime.module.css'

const kDefaultDateFormat: string = 'YYYY MMMM DD, dddd'
const kDefaultTimeFormat: string = 'hh:mm'
const kDefaultCalendarFormat = {
  sameDay: `[Today], ${kDefaultTimeFormat}`,
  nextDay: `[Tomorrow], ${kDefaultTimeFormat}`,
  nextWeek: `dddd, ${kDefaultTimeFormat}`,
  lastDay: `[Yesterday], ${kDefaultTimeFormat}`,
  lastWeek: `[Last] dddd, ${kDefaultTimeFormat}`,
  sameElse: `${kDefaultDateFormat}, ${kDefaultTimeFormat}`,
}

export function unixToString(
  timestamp: number,
  format: Optional<string>
): string {
  const timeMoment = moment.unix(timestamp)
  return momentToString(timeMoment, format)
}

export function momentToString(time: moment, format: Optional<string>): string {
  return format ? time.format(format) : time.calendar(kDefaultCalendarFormat)
}

export const DateTime = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    const { format, timestamp } = element

    const str = unixToString(timestamp, format)

    let className = styles.pill

    const selected = useSelected()
    const focused = useFocused()
    if (selected && focused) {
      className = jcss(className, styles.focused)
    }
    return (
      <span {...attributes}>
        <span contentEditable={false}>
          <span ref={ref} className={className}>
            {str}
          </span>
          {children}
        </span>
      </span>
    )
  }
)
