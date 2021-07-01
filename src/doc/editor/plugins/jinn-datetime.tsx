import React from 'react'

import moment from 'moment'

import { GridCard } from '../../../grid/SearchGrid'
import { momentToString } from '../components/DateTime'

import { debug } from '../../../util/log'

const lodash = require('lodash')

export const DateTimeCard = React.forwardRef(({ items }, ref) => {
  // TODO(akindyakov): continue here
  const str = items
    .map((item) => {
      const { time, format } = item
      return momentToString(time, format || null)
    })
    .join('\n')
  return (
    <GridCard onClick={null} ref={ref}>
      {str}
    </GridCard>
  )
})

const kDefaultTime = { hour: 9, minute: 30, second: 0 }

const kNowRe = /^(now|date)/i
const kTodayRe = /^toda?y?/i
const kYesterdayRe = /^yeste?r?d?a?y?/i
const kTomorrowRe = /^tomor?r?o?w?/i
const kDateYearMonthDay =
  /([12]*\d{3})([-/_.:])(0[1-9]|1[0-2])[-/_.:](0[1-9]|[12]\d|3[01])/
const kTime12hAm = /((1[0-2]|0?[1-9])[-.:]([0-5][0-9]) ?([AaPp][Mm]))/
const kTime24h = /(0[0-9]|1[0-9]|2[0-3])[-.:]([0-5][0-9])/
const kWeekDay = /\b((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?)\b/i
const kLastWeekDay =
  /last *((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?)\b/i
const kNextWeekDay =
  /next *((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?)\b/i

const kTraps = [
  (value) => (value.match(kNowRe) ? { time: moment() } : null),
  (value) => (value.match(kTodayRe) ? { time: moment() } : null),
  (value) =>
    value.match(kYesterdayRe) ? { time: moment().subtract(1, 'days') } : null,
  (value) =>
    value.match(kTomorrowRe) ? { time: moment().add(1, 'days') } : null,
  (value) => {
    const m = value.match(kDateYearMonthDay)
    if (m) {
      const year = lodash.parseInt(m[1])
      const sep = m[2]
      const month = lodash.parseInt(m[3]) - 1 // Starts from 0
      const day = lodash.parseInt(m[4])
      const { hour, minute, second } = kDefaultTime
      return {
        time: moment({ year, month, day, hour, minute, second }),
        format: `YYYY${sep}MM${sep}DD`,
      }
    }
    return null
  },
]

export const dateTimeJinnSearch = (value: string) => {
  const items = kTraps.map((trap) => trap(value)).filter((v) => v != null)
  if (items) {
    const key = 'mzd-date-time-jinn-card'
    return <DateTimeCard items={items} key={key} />
  }
  return null
}
