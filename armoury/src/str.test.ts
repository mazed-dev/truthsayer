import {
  isSmartCase,
  splitStringByWord,
  padNonEmptyStringWithSpaceHead,
  padNonEmptyStringWithSpaceTail,
  sortOutSpacesAroundPunctuation,
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

test('sortOutSpacesAroundPunctuation', () => {
  expect(sortOutSpacesAroundPunctuation('')).toStrictEqual('')
  expect(sortOutSpacesAroundPunctuation('Abc bcd.')).toStrictEqual('Abc bcd.')
  expect(
    sortOutSpacesAroundPunctuation(
      'Mileena returned in Mortal Kombat 11 … First . second ! Is it the last one ? '
    )
  ).toStrictEqual(
    'Mileena returned in Mortal Kombat 11… First. second! Is it the last one?'
  )
  expect(sortOutSpacesAroundPunctuation(` " a " ' abc abc ' `)).toStrictEqual(
    `"a" 'abc abc'`
  )
  expect(
    sortOutSpacesAroundPunctuation(` [ 12 + 21 ] = { 21 + 12 } = ( 33 ) `)
  ).toStrictEqual(`[12 + 21] = {21 + 12} = (33)`)
  expect(
    sortOutSpacesAroundPunctuation(
      `These are the colours I ' m talking about : blue , red, yellow ! Yan said " they all need just a few tweaks " . `
    )
  ).toStrictEqual(
    `These are the colours I'm talking about: blue, red, yellow! Yan said "they all need just a few tweaks".`
  )
})
