import { _searchFieldsFor, _exactPatternsFromString } from './search'

test('Beagle.fromString simple', () => {
  const allOf = _exactPatternsFromString('Oxygen font family')
  expect(allOf).toStrictEqual([/oxygen/i, /font/i, /family/i])
})

test('Beagle.fromString exact string', () => {
  const allOf = _exactPatternsFromString('Oxygen "Font family"')
  expect(allOf).toStrictEqual([/Font family/, /oxygen/i])
})

test('searchFieldsFor allOf', () => {
  const fields = [
    'Glass can form naturally from volcanic magma.',
    'Obsidian is a common volcanic glass with high silica (SiO2) content formed when felsic lava extruded from a volcano cools rapidly.',
  ]
  expect(_searchFieldsFor(fields, [/obsidian/i])).toStrictEqual(true)

  expect(
    _searchFieldsFor(fields, [/obsidian/i, /common volcanic glass/, /magma/])
  ).toStrictEqual(true)

  expect(_searchFieldsFor(fields, [/magma obsidian/i, /silica/])).toStrictEqual(
    false
  )

  expect(_searchFieldsFor(fields, [/silica SiO2/i])).toStrictEqual(false)
})
