import { MimeType, Mime } from './mime'

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
  ].forEach((m: MimeType) => {
    expect(Mime.isText(m)).toStrictEqual(false)
  })
})

test('Mime.isImage', () => {
  ;[
    Mime.IMAGE_BMP,
    Mime.IMAGE_GIF,
    Mime.IMAGE_JPEG,
    Mime.IMAGE_PNG,
    Mime.IMAGE_SVG_XML,
    Mime.IMAGE_TIFF,
    Mime.IMAGE_WEBP,
  ].forEach((m: MimeType) => {
    expect(Mime.isImage(m)).toStrictEqual(true)
  })
  ;[
    Mime.FORM_DATA,
    Mime.JSON,
    Mime.PDF,
    Mime.TEXT_PLAIN,
    Mime.TEXT_PLAIN_UTF_8,
    Mime.TEXT_URI_LIST,
  ].forEach((m: MimeType) => {
    expect(Mime.isImage(m)).toStrictEqual(false)
  })
})
