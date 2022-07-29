import { filterAttentionSpans, countMomentsAfterX } from './pageAutoSaving'

import moment from 'moment'

test('filterAttentionSpans', () => {
  expect(filterAttentionSpans([])).toStrictEqual([])
  expect(
    filterAttentionSpans([moment('1995-12-25'), moment('1996-12-25')])
  ).toStrictEqual([moment('1995-12-25'), moment('1996-12-25')])
  // Filter out exact same
  expect(
    filterAttentionSpans([
      moment('2013-02-08 09:30:26'),
      moment('2013-02-08 09:30:26'),
    ])
  ).toStrictEqual([moment('2013-02-08 09:30:26')])
  // Filter out moments of under minute difference
  expect(
    filterAttentionSpans([
      moment('2013-02-08 09:30:26'),
      moment('2013-02-08 09:31:26'),
      moment('2013-02-08 09:31:49'),
    ])
  ).toStrictEqual([
    moment('2013-02-08 09:30:26'),
    moment('2013-02-08 09:31:26'),
  ])
  // Don't filter out moments of a minute difference
  expect(
    filterAttentionSpans([
      moment('2013-02-08 09:30:26'),
      moment('2013-02-08 09:31:26'),
      moment('2013-02-08 09:32:26'),
    ])
  ).toStrictEqual([
    moment('2013-02-08 09:30:26'),
    moment('2013-02-08 09:31:26'),
    moment('2013-02-08 09:32:26'),
  ])
})
test('countMomentsAfterX', () => {
  expect(countMomentsAfterX([], moment('2013-02-08 09:32:26'))).toStrictEqual(0)
  expect(
    countMomentsAfterX(
      [
        moment('2013-02-08 09:32:00'),
        moment('2013-02-08 09:32:36'),
        moment('2014-02-08 09:32:36'),
      ],
      moment('2013-02-08 09:32:26')
    )
  ).toStrictEqual(2)
})
