import { MimeType, Mime } from './mime'
import { Optional } from './optional'

test('Mime.parse', () => {
  ;[
    Mime.FORM_DATA,
    Mime.IMAGE_BMP,
    Mime.IMAGE_GIF,
    Mime.IMAGE_JPEG,
    Mime.IMAGE_PNG,
    Mime.IMAGE_SVG_XML,
    Mime.IMAGE_TIFF,
    Mime.IMAGE_WEBP,
    Mime.JSON,
    Mime.PDF,
    Mime.TEXT_PLAIN,
    Mime.TEXT_PLAIN_UTF_8,
    Mime.TEXT_URI_LIST,
    Mime.TEXT_URI_LIST,
  ].forEach((m: MimeType) => {
    const mimeStruct = Mime.parse(m)
    expect(mimeStruct.type.length).toBeGreaterThan(0)
    expect(mimeStruct.subtype.length).toBeGreaterThan(0)
    expect(mimeStruct.params).not.toBeNull()
  })
})

test('Mime.isText', () => {
  ;[
    Mime.TEXT_PLAIN,
    Mime.TEXT_PLAIN_UTF_8,
    Mime.TEXT_URI_LIST,
    Mime.TEXT_URI_LIST,
  ].forEach((m: MimeType) => {
    expect(Mime.isText(m)).toStrictEqual(true)
  })
})

test('Mime.fromString is exhaustive and covers all supported types', () => {
  // GIVEN
  const supportedTypes = Object.values(Mime).filter(
    // filter out non-enum values, e.g. methods like fromString()
    (value): value is string => {
      return typeof value === 'string'
    }
  )

  supportedTypes.forEach((typeString: string) => {
    // WHEN
    const parsed: Optional<MimeType> = Mime.fromString(typeString)
    // THEN
    expect(parsed).not.toBeNull()
    expect(parsed).toBe(typeString)
  })
})
