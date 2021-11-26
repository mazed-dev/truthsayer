/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */

import * as queryString from 'query-string'

export type MimeParamsValue = string | string[] | null
export type MimeParams = Record<string, MimeParamsValue>

export type MimeTypeStruct = {
  type: string
  subtype: string
  params: MimeParams
}

function parse(s: MimeType): MimeTypeStruct {
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
  return { type: _type, subtype, params }
}

function isText(mime: MimeType): boolean {
  return parse(mime).type === 'text'
}

function isImage(mime: MimeType): boolean {
  return parse(mime).type === 'image'
}

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

  parse,

  isImage,
  isText,
}

export type MimeType =
  | typeof Mime.JSON
  | typeof Mime.PDF
  | typeof Mime.FORM_DATA
  | typeof Mime.TEXT_URI_LIST
  | typeof Mime.TEXT_PLAIN
  | typeof Mime.TEXT_PLAIN_UTF_8
  | typeof Mime.IMAGE_BMP
  | typeof Mime.IMAGE_GIF
  | typeof Mime.IMAGE_JPEG
  | typeof Mime.IMAGE_PNG
  | typeof Mime.IMAGE_SVG_XML
  | typeof Mime.IMAGE_TIFF
  | typeof Mime.IMAGE_WEBP
