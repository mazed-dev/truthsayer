import { isPageReadable } from './unreadable'

test('unreadable.homepage', () => {
  expect(isPageReadable('https://stackoverflow.com/')).toStrictEqual(false)
  expect(isPageReadable('https://youtube.com/')).toStrictEqual(false)
  expect(isPageReadable('https://stackoverflow.com/index.html')).toStrictEqual(
    false
  )
  expect(isPageReadable('https://stackoverflow.com/index.php')).toStrictEqual(
    false
  )
  expect(
    isPageReadable('https://akindyakov.dev/routine-and-recipes/')
  ).toStrictEqual(true)
})

test('unreadable.unmemorable', () => {
  expect(isPageReadable('https://fb.com/')).toStrictEqual(false)
  expect(isPageReadable('https://google.com/')).toStrictEqual(false)
  expect(isPageReadable('https://instagram.com/')).toStrictEqual(false)
})

test('unreadable.tools', () => {
  expect(
    isPageReadable(
      'https://translate.google.com/?sl=en&tl=ru&text=text&op=translate'
    )
  ).toStrictEqual(false)
})
