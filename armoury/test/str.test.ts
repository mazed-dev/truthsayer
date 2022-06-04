import { isSmartCase } from '../src/str.js'

test('isSmartCase', () => {
  expect(isSmartCase('')).toBeFalsy()
  expect(isSmartCase(' ')).toBeFalsy()
  expect(isSmartCase('abc')).toBeFalsy()
  expect(isSmartCase('a b c')).toBeFalsy()
  expect(isSmartCase('для кирилицы')).toBeFalsy()

  expect(isSmartCase('aBc')).toBeTruthy()
  expect(isSmartCase('a B c')).toBeTruthy()
  expect(isSmartCase('Для Кирилицы')).toBeTruthy()
})
