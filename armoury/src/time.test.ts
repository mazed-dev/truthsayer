import { unixtime } from './time'
import moment from 'moment'

describe('unixtime', () => {
  it('fromDate', () => {
    const d = new Date()
    const t = unixtime.fromDate(d)
    expect(t).toEqual(moment(d).unix())
  })
})
