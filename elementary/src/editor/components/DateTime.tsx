/** @jsxImportSource @emotion/react */

import React from 'react'

import moment from 'moment'

import type { Optional } from 'armoury'
import { DateTimePill } from './components.js'

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
  return (
    <DateTimePill ref={ref} className={className}>
      {str}
    </DateTimePill>
  )
})

type DateTimeAttrs = React.HTMLProps<HTMLSpanElement> & {
  attributes: any
  element: any
}

export const DateTime = React.forwardRef<HTMLSpanElement, DateTimeAttrs>(
  ({ attributes, children, element }, ref) => {
    const { format, timestamp } = element
    const time = moment.unix(timestamp)
    return (
      <span {...attributes}>
        <span contentEditable={false}>
          <DateTimeBadge time={time} format={format} ref={ref} />
          {children}
        </span>
      </span>
    )
  }
)
