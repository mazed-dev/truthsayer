import { MimeType, Mime } from './mime'

test('MimeType.isSame', () => {
  ;[
    MimeType.JSON,
    MimeType.PDF,
    MimeType.FORM_DATA,
    MimeType.TEXT_URI_LIST,
    MimeType.IMAGE_BMP,
    MimeType.IMAGE_GIF,
    MimeType.IMAGE_JPEG,
    MimeType.IMAGE_PNG,
    MimeType.IMAGE_SVG_XML,
    MimeType.IMAGE_TIFF,
    MimeType.IMAGE_WEBP,
  ].forEach((m: MimeType) => {
    expect(m.isSame(m)).toStrictEqual(true)
    expect(m.isSameType(m)).toStrictEqual(true)
    expect(m.isSameSubType(m)).toStrictEqual(true)
  })
})

test('MimeType.toString', () => {
  expect(MimeType.PDF.toString()).toStrictEqual(Mime.PDF)
  expect(MimeType.JSON.toString()).toStrictEqual(Mime.JSON)
  expect(MimeType.IMAGE_BMP.toString()).toStrictEqual(Mime.IMAGE_BMP)
  expect(MimeType.IMAGE_GIF.toString()).toStrictEqual(Mime.IMAGE_GIF)
  expect(MimeType.IMAGE_JPEG.toString()).toStrictEqual(Mime.IMAGE_JPEG)
  expect(MimeType.IMAGE_PNG.toString()).toStrictEqual(Mime.IMAGE_PNG)
  expect(MimeType.IMAGE_SVG_XML.toString()).toStrictEqual(Mime.IMAGE_SVG_XML)
  expect(MimeType.IMAGE_TIFF.toString()).toStrictEqual(Mime.IMAGE_TIFF)
  expect(MimeType.IMAGE_WEBP.toString()).toStrictEqual(Mime.IMAGE_WEBP)
})

test('MimeType JSON.stringify', () => {
  ;[
    MimeType.JSON,
    MimeType.PDF,
    MimeType.FORM_DATA,
    MimeType.TEXT_URI_LIST,
    MimeType.IMAGE_BMP,
    MimeType.IMAGE_GIF,
    MimeType.IMAGE_JPEG,
    MimeType.IMAGE_PNG,
    MimeType.IMAGE_SVG_XML,
    MimeType.IMAGE_TIFF,
    MimeType.IMAGE_WEBP,
  ].forEach((m: MimeType) => {
    const obj = {
      mime: m,
    }
    expect(JSON.stringify(m)).toStrictEqual(`"${m.toString()}"`)
    expect(JSON.stringify(obj)).toStrictEqual(`{"mime":"${m.toString()}"}`)
  })
})

test('Mime JSON.parse', () => {
  ;[
    Mime.JSON,
    Mime.PDF,
    Mime.FORM_DATA,
    Mime.TEXT_URI_LIST,
    Mime.IMAGE_BMP,
    Mime.IMAGE_GIF,
    Mime.IMAGE_JPEG,
    Mime.IMAGE_PNG,
    Mime.IMAGE_SVG_XML,
    Mime.IMAGE_TIFF,
    Mime.IMAGE_WEBP,
  ].forEach((str) => {
    const obj = {
      mime: str,
    }
    expect(JSON.parse(JSON.stringify(obj))).toStrictEqual(obj)
  })
})

test('MimeType JSON.parse with reviver', () => {
  ;[
    MimeType.JSON,
    MimeType.PDF,
    MimeType.FORM_DATA,
    MimeType.TEXT_URI_LIST,
    MimeType.IMAGE_BMP,
    MimeType.IMAGE_GIF,
    MimeType.IMAGE_JPEG,
    MimeType.IMAGE_PNG,
    MimeType.IMAGE_SVG_XML,
    MimeType.IMAGE_TIFF,
    MimeType.IMAGE_WEBP,
  ].forEach((m) => {
    const obj = {
      mime: m,
    }
    const reviver = (key: string, value: any): any => {
      if (key === 'mime') {
        return MimeType.reviver(value)
      }
      return value
    }
    const str = JSON.stringify(obj)
    expect(JSON.parse(str, reviver)).toStrictEqual(obj)
  })
})
