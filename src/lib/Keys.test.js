import React from 'react'
import { render } from '@testing-library/react'
import { isSymbol, isHotkeyCopy, Keys } from './Keys.jsx'

test('isSymbol - abc', () => {
  expect(isSymbol(Keys.A)).toStrictEqual(true)
  expect(isSymbol(Keys.Z)).toStrictEqual(true)
  expect(isSymbol(Keys.a)).toStrictEqual(true)
  expect(isSymbol(Keys.z)).toStrictEqual(true)
})

test('isSymbol - num', () => {
  expect(isSymbol(Keys.ZERO)).toStrictEqual(true)
})

test('isSymbol - punct', () => {
  expect(isSymbol(Keys.COMMA)).toStrictEqual(true)
  expect(isSymbol(Keys.PERIOD)).toStrictEqual(true)
})

test('isSymbol - space', () => {
  expect(isSymbol(Keys.SPACE)).toStrictEqual(false)
  expect(isSymbol(Keys.RETURN)).toStrictEqual(false)
})

test('isSymbol - control', () => {
  ;[
    Keys.ALT,
    Keys.BACKSPACE,
    Keys.DELETE,
    Keys.HOME,
    Keys.UP,
    Keys.DOWN,
    Keys.PAGE_DOWN,
    Keys.PAGE_UP,
    Keys.RIGHT,
    Keys.LEFT,
    Keys.END,
    Keys.ESC,
  ].forEach((code) => {
    expect(isSymbol(code)).toStrictEqual(false)
  })
})

test('isHotkeyCopy', () => {
  expect(
    isHotkeyCopy({
      ctrlKey: true,
      which: Keys.v,
    })
  ).toStrictEqual(true)

  expect(
    isHotkeyCopy({
      ctrlKey: true,
      which: Keys.z,
    })
  ).toStrictEqual(false)

  expect(
    isHotkeyCopy({
      ctrlKey: false,
      which: Keys.v,
    })
  ).toStrictEqual(false)
})
