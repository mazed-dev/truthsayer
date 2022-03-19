/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */

import * as queryString from 'query-string'
import { Optional } from './optional'

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

/**
 * Ensure an input raw string is one of the supported Mime types
 *
 * Mime types described as raw strings can be encountered at a variaty of
 * outer boundaries of Mazed, e.g. 3rd-party APIs. Inside the codebase itself
 * however there is a finite number of types recognised by the system, enumerated
 * by MimeType.
 * This function may be useful to sanitise raw strings and ensure that only
 * supported types propagate through the system.
 */
function fromString(rawMime: string): Optional<MimeType> {
  // The implementation of this function may look very bizzare and a reader
  // may wonder why a more robust, shorter implementation like
  // https://stackoverflow.com/questions/43804805/check-if-value-exists-in-enum-in-typescript/47755096#47755096
  // has not been used.
  //
  // A lengthy switch-case has been chosen delibirately because of performance
  // implications of Object.values(). Minor gains in performance were considered
  // meaningful as this method may be called in parts of the code which iterate
  // over storages of user files which can include very large numbers of items.
  switch (rawMime) {
    case Mime.JSON: {
      return Mime.JSON
    }
    case Mime.PDF: {
      return Mime.PDF
    }
    case Mime.FORM_DATA: {
      return Mime.FORM_DATA
    }
    case Mime.TEXT_URI_LIST: {
      return Mime.TEXT_URI_LIST
    }
    case Mime.TEXT_PLAIN: {
      return Mime.TEXT_PLAIN
    }
    case Mime.TEXT_PLAIN_UTF_8: {
      return Mime.TEXT_PLAIN_UTF_8
    }
    case Mime.IMAGE_BMP: {
      return Mime.IMAGE_BMP
    }
    case Mime.IMAGE_GIF: {
      return Mime.IMAGE_GIF
    }
    case Mime.IMAGE_JPEG: {
      return Mime.IMAGE_JPEG
    }
    case Mime.IMAGE_PNG: {
      return Mime.IMAGE_PNG
    }
    case Mime.IMAGE_SVG_XML: {
      return Mime.IMAGE_SVG_XML
    }
    case Mime.IMAGE_TIFF: {
      return Mime.IMAGE_TIFF
    }
    case Mime.IMAGE_WEBP: {
      return Mime.IMAGE_WEBP
    }
    default:
      return null
  }
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
  fromString,

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
