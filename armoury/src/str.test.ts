import {
  isSmartCase,
  splitStringByWord,
  padNonEmptyStringWithSpaceHead,
  padNonEmptyStringWithSpaceTail,
} from './str'

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

test('splitStringByWord', () => {
  expect(splitStringByWord('', 0)).toStrictEqual(['', ''])
  expect(splitStringByWord('', 1)).toStrictEqual(['', ''])
  expect(splitStringByWord('a b', 1)).toStrictEqual(['a', 'b'])
  expect(splitStringByWord('a b c d e f', 5)).toStrictEqual(['a b c', 'd e f'])
  expect(splitStringByWord('a b c .', 195)).toStrictEqual(['a b c .', ''])
})

test('padNonEmptyStringWithSpaceHead', () => {
  expect(padNonEmptyStringWithSpaceHead('')).toStrictEqual('')
  expect(padNonEmptyStringWithSpaceHead(' ')).toStrictEqual(' ')
  expect(padNonEmptyStringWithSpaceHead('a')).toStrictEqual(' a')
})

test('padNonEmptyStringWithSpaceTail', () => {
  expect(padNonEmptyStringWithSpaceTail('')).toStrictEqual('')
  expect(padNonEmptyStringWithSpaceTail(' ')).toStrictEqual(' ')
  expect(padNonEmptyStringWithSpaceTail('a')).toStrictEqual('a ')
})
