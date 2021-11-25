import * as queryString from 'query-string'

export const Mime = {
  JSON: 'application/json',
  PDF: 'application/pdf',

  FORM_DATA: 'multipart/form-data',

  TEXT_URI_LIST: 'text/uri-list',

  TEXT_PLAIN: 'text/plain',
  TEXT_PLAIN_UTF_8: 'text/plain; charset=utf-8',

  IMAGE_BMP: 'image/bmp',
  IMAGE_GIF: 'image/gif',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_SVG_XML: 'image/svg+xml',
  IMAGE_TIFF: 'image/tiff',
  IMAGE_WEBP: 'image/webp',
}

type MimeParamsValue = string | string[] | null
type MimeParams = Record<string, MimeParamsValue>

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */
export class MimeType {
  _type: string
  subtype: string
  params: MimeParams
  constructor({
    type,
    subtype,
    params,
  }: {
    type: string
    subtype: string
    params?: MimeParams
  }) {
    this._type = type
    this.subtype = subtype || '*'
    this.params = params || {}
  }

  getType(): string {
    return this._type
  }

  getSubType(): string {
    return this.subtype
  }

  getParameter(key: string): MimeParamsValue {
    const { params } = this
    return params[key] || null
  }

  toString(): string {
    const { _type, subtype, params } = this
    let s = `${_type}/${subtype}`
    if (params.length) {
      const p = queryString.stringify(params)
      s = `${s};${p}`
    }
    return s
  }

  /**
   * To support correct serialization to string in JSON.stringify
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#tojson_behavior
   */
  toJSON(): string {
    return this.toString()
  }

  isText(): boolean {
    return this._type === 'text'
  }

  isImage(): boolean {
    return this._type === 'image'
  }

  isSame(m: MimeType): boolean {
    return this.isSameType(m) && this.isSameSubType(m)
  }

  isSameType(m: MimeType): boolean {
    return this.getType() === m.getType()
  }

  isSameSubType(m: MimeType): boolean {
    return this.getSubType() === m.getSubType()
  }

  static parse(s: string): MimeType {
    let subtype = ''
    let params: MimeParams = {}
    const fullTypeAndParam = s.split(';')
    if (fullTypeAndParam.length > 1) {
      params = queryString.parse(fullTypeAndParam[1].toLowerCase())
    }
    const fullType = fullTypeAndParam[0]
    const typeAndSubType = fullType.split('/')
    if (typeAndSubType.length > 1) {
      subtype = typeAndSubType[1].toLowerCase()
    }
    const _type = typeAndSubType[0].toLowerCase()
    return new MimeType({ type: _type, subtype, params })
  }

  static reviver(value: any): MimeType {
    if (typeof value === 'string') {
      return MimeType.parse(value as string)
    }
    throw new Error(`Unexpected type of mime "${typeof value}"`)
  }

  static JSON = MimeType.parse(Mime.JSON)
  static PDF = MimeType.parse(Mime.PDF)
  static FORM_DATA = MimeType.parse(Mime.FORM_DATA)
  static TEXT_URI_LIST = MimeType.parse(Mime.TEXT_URI_LIST)
  static IMAGE_BMP = MimeType.parse(Mime.IMAGE_BMP)
  static IMAGE_GIF = MimeType.parse(Mime.IMAGE_GIF)
  static IMAGE_JPEG = MimeType.parse(Mime.IMAGE_JPEG)
  static IMAGE_PNG = MimeType.parse(Mime.IMAGE_PNG)
  static IMAGE_SVG_XML = MimeType.parse(Mime.IMAGE_SVG_XML)
  static IMAGE_TIFF = MimeType.parse(Mime.IMAGE_TIFF)
  static IMAGE_WEBP = MimeType.parse(Mime.IMAGE_WEBP)
}
