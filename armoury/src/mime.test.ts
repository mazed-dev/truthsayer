import { MimeType, Mime } from './mime'
import { Optional } from './optional'

test('Mime.parse', () => {
  ;[
    MimeType.FORM_DATA,
    MimeType.IMAGE_BMP,
    MimeType.IMAGE_GIF,
    MimeType.IMAGE_JPEG,
    MimeType.IMAGE_PNG,
    MimeType.IMAGE_SVG_XML,
    MimeType.IMAGE_TIFF,
    MimeType.IMAGE_WEBP,
    MimeType.JSON,
    MimeType.PDF,
    MimeType.TEXT_PLAIN,
    MimeType.TEXT_PLAIN_UTF_8,
    MimeType.TEXT_URI_LIST,
    MimeType.TEXT_URI_LIST,
  ].forEach((m: MimeType) => {
    const mimeStruct = Mime.parse(m)
    expect(mimeStruct.type.length).toBeGreaterThan(0)
    expect(mimeStruct.subtype.length).toBeGreaterThan(0)
    expect(mimeStruct.params).not.toBeNull()
  })
})

test('Mime.isText', () => {
  ;[
    MimeType.TEXT_PLAIN,
    MimeType.TEXT_PLAIN_UTF_8,
    MimeType.TEXT_URI_LIST,
    MimeType.TEXT_URI_LIST,
  ].forEach((m: MimeType) => {
    expect(Mime.isText(m)).toStrictEqual(true)
  })
})

test('Mime.fromString is exhaustive and covers all supported types', () => {
  // GIVEN
  const supportedTypes = Object.values(MimeType)

  supportedTypes.forEach((typeString: string) => {
    // WHEN
    const parsed: Optional<MimeType> = Mime.fromString(typeString)
    // THEN
    expect(parsed).not.toBeNull()
    expect(parsed).toBe(typeString)
  })
})
