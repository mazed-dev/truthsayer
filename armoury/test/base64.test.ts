import { base64 } from '../src/base64.js'

test('Object, toBase64 and back', () => {
  const obj = {
    abc: 'Rural tranquillity',
  }
  const str = base64.string.fromObject(obj)
  expect(str).toContain('eyJhYmMiOiJSdXJhbCB0cmFucXVpbGxpdHkifQ')
  expect(base64.string.toObject(str)).toStrictEqual(obj)
})

test('Uint8Array, fromByteArray and back', () => {
  const arr = Uint8Array.from([1, 2, 3, 4, 5])
  const str = base64.fromByteArray(arr)
  expect(str).toStrictEqual('AQIDBAU=')
  const receivedArr = base64.toByteArray(str)
  for (const index in arr) {
    expect(receivedArr[index]).toStrictEqual(arr[index])
  }
})
