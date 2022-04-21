import moment from 'moment'
import lodash from 'lodash'

export function _parse12hAm(
  hour: string,
  minute: string,
  a: string
): moment.Moment {
  a = a.slice(0, 1).toLowerCase()
  let h = lodash.parseInt(hour)
  let m = lodash.parseInt(minute)
  if (h < 1 || h > 12) {
    h = 12
  }
  if (m < 0 || m > 59) {
    m = 0
  }
  if (a === 'p') {
    if (h < 12) {
      h += 12
    }
  } else {
    // am
    if (h === 12) {
      h = 0
    }
  }
  return moment({ hour: h, minute: m })
}

const kDefaultTime = { hour: 9, minute: 30, second: 0 }

const kNowRe = /^(now|date)/i
const kTodayRe = /^toda?y?/i
const kYesterdayRe = /^yeste?r?d?a?y?/i
const kTomorrowRe = /^tomor?r?o?w?/i
const kDateYearMonthDay =
  /([12]*\d{3})([-/_.:])(0[1-9]|1[0-2])[-/_.:](0[1-9]|[12]\d|3[01])/
const kTime12hAm = /(1[0-2]|0?[1-9])([-.:])([0-5][0-9])( ?)([AaPp][Mm])/
const kTime24h = /(0[0-9]|1[0-9]|2[0-3])([-.:])([0-5][0-9])/
const kLastWeekDay =
  /last *((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?)\b/i
const kNextWeekDay =
  /(next)? *((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?)\b/i
const kDefaultDateFormat: string = 'YYYY MMMM DD, dddd'

type TrappedDate = { time: moment.Moment; format?: string }
type DateTrap = (v: string) => TrappedDate[]

const kTraps: DateTrap[] = [
  (value: string) => (value.match(kNowRe) ? [{ time: moment() }] : []),
  (value: string) => (value.match(kTodayRe) ? [{ time: moment() }] : []),
  (value: string) =>
    value.match(kYesterdayRe)
      ? [{ time: moment().subtract(1, 'days'), format: kDefaultDateFormat }]
      : [],
  (value: string) =>
    value.match(kTomorrowRe)
      ? [{ time: moment().add(1, 'days'), format: kDefaultDateFormat }]
      : [],
  (value: string) => {
    const m = value.match(kDateYearMonthDay)
    if (m) {
      const year = lodash.parseInt(m[1])
      const sep = m[2]
      const month = lodash.parseInt(m[3]) - 1 // Starts from 0
      const day = lodash.parseInt(m[4])
      const { hour, minute, second } = kDefaultTime
      const time = moment({ year, month, day, hour, minute, second })
      return [
        {
          time,
          format: `YYYY${sep}MM${sep}DD`,
        },
        {
          time,
          format: kDefaultDateFormat,
        },
      ]
    }
    return []
  },
  (value: string) => {
    const m = value.match(kTime12hAm)
    if (m) {
      const hour = m[1]
      const sep1 = m[2]
      const minute = m[3]
      const sep2 = m[4]
      const a = m[5]
      const format = `hh${sep1}mm${sep2}a`
      const time = _parse12hAm(hour, minute, a)
      return [{ time, format }, { time }]
    }
    return []
  },
  (value: string) => {
    const m = value.match(kTime24h)
    if (m) {
      const hour = lodash.parseInt(m[1])
      const sep = m[2]
      const minute = lodash.parseInt(m[3])
      const format = `hh${sep}mm`
      const time = moment({ hour, minute })
      return [{ time, format }, { time }]
    }
    return []
  },
  (value: string) => {
    const m = value.match(kLastWeekDay)
    if (m) {
      const { hour, minute, second } = kDefaultTime
      let time = moment()
      const today = time.valueOf()
      time = time.day(m[1])
      if (today <= time.valueOf()) {
        time = time.subtract(1, 'week')
      }
      time = time.hour(hour).minute(minute).second(second)
      return [{ time }]
    }
    return []
  },
  (value: string) => {
    const m = value.match(kNextWeekDay)
    if (m) {
      const { hour, minute, second } = kDefaultTime
      let time = moment()
      const today = time.valueOf()
      time = time.day(m[2])
      if (today >= time.valueOf()) {
        time = time.subtract(1, 'week')
      }
      time = time.hour(hour).minute(minute).second(second)
      return [{ time }]
    }
    return []
  },
]

export function tryToParseDate(value: string): TrappedDate[] {
  return kTraps.flatMap((trap) => trap(value))
}
