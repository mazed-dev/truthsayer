import { getLastEditedParagrph } from './getLastEditedParagraph'

test('getLastEditedParagrph -- to short', () => {
  expect(getLastEditedParagrph('')).toBeNull()
  expect(getLastEditedParagrph('a')).toBeNull()
  expect(getLastEditedParagrph('abc')).toBeNull()
})

test('getLastEditedParagrph -- edited paragraph', () => {
  expect(
    getLastEditedParagrph(
      `Carbon catching factories, also known as direct air capture facilities, are designed to remove carbon dioxide directly from the air.
       These facilities use technology to capture and store carbon dioxide, preventing it from entering the atmosphere. The captured carbon dioxide can be stored underground or used to create other products, such as fuel or building materials.
       The technology is still in its early stages, but it has the potential to significantly reduce carbon emissions and slow the effects of climate change`,
      `Carbon catching factories, also known as direct air capture facilities, are designed to remove carbon dioxide directly from the air.
       These facilities use technology to capture and store carbon dioxide, preventing it from entering the atmosphere. The captured carbon dioxide can be stored underground or used to create other products, such as fuel or building materials.
       The technology is still in its early stages, but it has the potential to significantly reduce carbon emissions and slow the effects of climate `
    )
  ).toStrictEqual(
    'The technology is still in its early stages, but it has the potential to significantly reduce carbon emissions and slow the effects of climate change'
  )
})
