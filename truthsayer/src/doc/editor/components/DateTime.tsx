/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import moment from 'moment'

import { Optional } from 'armoury'

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

const Pill = styled.span`
  color: #fff;
  background-color: #6c757d;

  border-radius: 10em;

  display: inline-block;

  padding-top: 0;
  padding-bottom: 0;
  padding-right: 0.6em;
  padding-left: 0.6em;

  margin-bottom: 0;
  margin-top: 0;
  margin-right: 0.2em;
  margin-left: 0.2em;

  font-weight: 600;

  white-space: nowrap;
  vertical-align: baseline;

  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:before {
    content: '📅 ';
    margin-right: 0.2em;
  }
`

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
    <Pill ref={ref} className={className}>
      {str}
    </Pill>
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
          <DateTimeBadge
            time={time}
            format={format}
            ref={ref}
          />
          {children}
        </span>
      </span>
    )
  }
)
