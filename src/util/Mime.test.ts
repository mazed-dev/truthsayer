import { MimeType } from './Mime'

test('MimeType parse JSON', () => {
  const m = MimeType.parse('application/json')
  expect(m.getType()).toStrictEqual('application')
  expect(m.getSubType()).toStrictEqual('json')
  expect(m.getParameter('abc')).toStrictEqual(null)
  expect(m.toString()).toStrictEqual('application/json')
})

test('MimeType parse text/plain; charset=utf-8', () => {
  const m = MimeType.parse('text/plain; charset=utf-8')
  expect(m.getType()).toStrictEqual('text')
  expect(m.getSubType()).toStrictEqual('plain')
  expect(m.getParameter('charset')).toStrictEqual('utf-8')
  expect(m.getParameter('abc')).toStrictEqual(null)
})
