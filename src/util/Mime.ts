import { Optional } from '../util/types'
import { debug } from '../util/log'

const queryString = require('query-string')

export const Mime: Map<string, string> = {
  JSON: 'application/json',
  PDF: 'application/pdf',

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

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */
export class MimeType {
  constructor({ type, subtype, params }) {
    this._type = type
    this.subtype = subtype || '*'
    this.params = params || null
  }

  getType(): string {
    return this._type
  }

  getSubType(): string {
    return this.subtype
  }

  getParameter(key: string): Optional<string> {
    const { params } = this
    if (params) {
      return params[key] || null
    }
    return null
  }

  toString(): string {
    const { _type, subtype, params } = this
    let s = `${_type}/${subtype}`
    if (params) {
      const p = queryString.stringify(params || {})
      s = `${s};${p}`
    }
    return s
  }

  isText(): boolean {
    return this._type === 'text'
  }

  isImage(): boolean {
    return this._type === 'image'
  }

  static parse(s: string): MimeType {
    let subtype
    let params
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
}
