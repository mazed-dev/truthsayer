import { _searchFieldsFor, _exactPatternsFromString } from './search'

test('Beagle.fromString simple', () => {
  const allOf = _exactPatternsFromString('Oxygen font family')
  expect(allOf).toStrictEqual(['oxygen', 'font', 'family'])
})

test('Beagle.fromString exact string', () => {
  const allOf = _exactPatternsFromString('Oxygen "Font Family"')
  expect(allOf).toStrictEqual(['font family', 'oxygen'])
})

test('searchFieldsFor allOf', () => {
  const fields = [
    'Glass can form naturally from volcanic magma.',
    'Obsidian is a common volcanic glass with high silica (SiO2) content formed when felsic lava extruded from a volcano cools rapidly.',
  ]
  expect(_searchFieldsFor(fields, ['obsidian'])).toStrictEqual(true)

  expect(
    _searchFieldsFor(fields, ['obsidian', 'common volcanic glass', 'magma'])
  ).toStrictEqual(true)

  expect(_searchFieldsFor(fields, ['magma obsidian', 'silica'])).toStrictEqual(
    false
  )

  expect(_searchFieldsFor(fields, ['silica sio2'])).toStrictEqual(false)
})
