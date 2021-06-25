import React from 'react'

import { Badge } from 'react-bootstrap'

import moment from 'moment'

import { joinClasses } from '../../../util/elClass.js'
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
  return format
    ? timeMoment.format(format)
    : timeMoment.calendar(kDefaultCalendarFormat)
}

export const DateTime = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    const { format, timestamp } = element
    const timeMoment = moment.unix(timestamp)
    const str = unixToString(timestamp, format)
    return (
      <span ref={ref} {...attributes} className={styles.pill}>
        {children}
      </span>
    )
  }
)
