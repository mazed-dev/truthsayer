import { log, isAbortError } from './index'

test('exported', async () => {
  expect(log).not.toBeUndefined()
  expect(isAbortError).not.toBeUndefined()
})
