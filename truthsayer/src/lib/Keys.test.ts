// @ts-nocheck

import { isSymbol, isHotkeyCopy, Keys } from './Keys'

test('isSymbol - abc', () => {
  expect(isSymbol(Keys.get('A'))).toStrictEqual(true)
  expect(isSymbol(Keys.get('Z'))).toStrictEqual(true)
  expect(isSymbol(Keys.get('a'))).toStrictEqual(true)
  expect(isSymbol(Keys.get('z'))).toStrictEqual(true)
})

test('isSymbol - num', () => {
  expect(isSymbol(Keys.get('ZERO'))).toStrictEqual(true)
})

test('isSymbol - punct', () => {
  expect(isSymbol(Keys.get('COMMA'))).toStrictEqual(true)
  expect(isSymbol(Keys.get('PERIOD'))).toStrictEqual(true)
})

test('isSymbol - space', () => {
  expect(isSymbol(Keys.get('SPACE'))).toStrictEqual(false)
  expect(isSymbol(Keys.get('RETURN'))).toStrictEqual(false)
})

test('isSymbol - control', () => {
  ;[
    Keys.get('ALT'),
    Keys.get('BACKSPACE'),
    Keys.get('DELETE'),
    Keys.get('HOME'),
    Keys.get('UP'),
    Keys.get('DOWN'),
    Keys.get('PAGE_DOWN'),
    Keys.get('PAGE_UP'),
    Keys.get('RIGHT'),
    Keys.get('LEFT'),
    Keys.get('END'),
    Keys.get('ESC'),
  ].forEach((code) => {
    expect(isSymbol(code)).toStrictEqual(false)
  })
})

test('isHotkeyCopy', () => {
  expect(
    isHotkeyCopy({
      ctrlKey: true,
      which: Keys.get('v'),
    })
  ).toStrictEqual(true)

  expect(
    isHotkeyCopy({
      ctrlKey: true,
      which: Keys.get('z'),
    })
  ).toStrictEqual(false)

  expect(
    isHotkeyCopy({
      ctrlKey: false,
      which: Keys.get('v'),
    })
  ).toStrictEqual(false)
})
