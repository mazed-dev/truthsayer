import React from 'react'

import { Badge } from 'react-bootstrap'

import moment from 'moment'

import { joinClasses } from '../../../util/elClass.js'

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

export const DateTime = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    const { format, timestamp } = element
    const timeMoment = moment.unix(timestamp)
    const str = format
      ? timeMoment.format(format)
      : timeMoment.calendar(kDefaultCalendarFormat)
    return (
      <Badge pill variant="secondary" ref={ref}>
        {date_str}
      </Badge>
    )
  }
)
