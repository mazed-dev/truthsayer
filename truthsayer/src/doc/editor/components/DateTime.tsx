import React from 'react'

import { useSelected, useFocused } from 'slate-react'

import { Badge } from 'react-bootstrap'

import moment from 'moment'

import { jcss } from 'elementary'
import { Optional } from '../../../util/types'
import { debug } from '../../../util/log'

import './components.css'

import styles from './DateTime.module.css'

export const kDefaultDateFormat: string = 'YYYY MMMM DD, dddd'
export const kDefaultTimeFormat: string = 'HH:mm'

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

export function momentToString(
  time: moment.Moment,
  format: Optional<string>
): string {
  return format ? time.format(format) : time.calendar(kDefaultCalendarFormat)
}

type DateTimeBadgeAttrs = React.HTMLProps<HTMLSpanElement> & {
  time: moment.Moment
  format: Optional<string>
}

export const DateTimeBadge = React.forwardRef<
  HTMLSpanElement,
  DateTimeBadgeAttrs
>(({ className, time, format }, ref) => {
  const str = momentToString(time, format)
  className = className ? jcss(styles.pill, className) : styles.pill
  return (
    <span ref={ref} className={className}>
      {str}
    </span>
  )
})

type DateTimeAttrs = React.HTMLProps<HTMLSpanElement> & {
  attributes: any
  element: any
}

export const DateTime = React.forwardRef<HTMLSpanElement, DateTimeAttrs>(
  ({ attributes, children, element }, ref) => {
    const { format, timestamp } = element
    const selected = useSelected()
    const focused = useFocused()
    const className = selected && focused ? styles.focused : undefined
    const time = moment.unix(timestamp)
    return (
      <span {...attributes}>
        <span contentEditable={false}>
          <DateTimeBadge
            time={time}
            format={format}
            className={className}
            ref={ref}
          />
          {children}
        </span>
      </span>
    )
  }
)
