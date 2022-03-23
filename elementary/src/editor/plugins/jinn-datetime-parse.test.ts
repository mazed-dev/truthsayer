import { _parse12hAm } from './jinn-datetime-parse'

test('_parse12hAm 00:00', () => {
  const m = _parse12hAm('12', '00', 'am')
  expect(m.hour()).toStrictEqual(0)
  expect(m.minute()).toStrictEqual(0)
})

test('_parse12hAm 00:15', () => {
  const m = _parse12hAm('12', '15', 'am')
  expect(m.hour()).toStrictEqual(0)
  expect(m.minute()).toStrictEqual(15)
})

test('_parse12hAm 01:15', () => {
  const m = _parse12hAm('01', '15', 'am')
  expect(m.hour()).toStrictEqual(1)
  expect(m.minute()).toStrictEqual(15)
})

test('_parse12hAm 12:00 noon', () => {
  const m = _parse12hAm('12', '00', 'pm')
  expect(m.hour()).toStrictEqual(12)
  expect(m.minute()).toStrictEqual(0)
})

test('_parse12hAm 12:15', () => {
  const m = _parse12hAm('12', '15', 'pm')
  expect(m.hour()).toStrictEqual(12)
  expect(m.minute()).toStrictEqual(15)
})

test('_parse12hAm 13:15', () => {
  const m = _parse12hAm('01', '15', 'pm')
  expect(m.hour()).toStrictEqual(13)
  expect(m.minute()).toStrictEqual(15)
})
