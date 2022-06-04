/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */

import * as queryString from 'query-string'
import { Optional } from './optional.js'

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
    params = queryString.parse(fullTypeAndParam[1].toLowerCase(), {
      parseNumbers: false,
      parseBooleans: false,
    }) as MimeParams
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
  const isTargetValue = (value: MimeType, index: number, obj: MimeType[]) => {
    return value === rawMime
  }
  if (kKnownMimeTypes.findIndex(isTargetValue) < 0) {
    return null
  }
  return rawMime as MimeType
}

export enum MimeType {
  JSON = 'application/json',
  PDF = 'application/pdf',
  FORM_DATA = 'multipart/form-data',
  TEXT_URI_LIST = 'text/uri-list',
  TEXT_PLAIN = 'text/plain',
  TEXT_PLAIN_UTF_8 = 'text/plain; charset=utf-8',
  IMAGE_BMP = 'image/bmp',
  IMAGE_GIF = 'image/gif',
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_SVG_XML = 'image/svg+xml',
  IMAGE_TIFF = 'image/tiff',
  IMAGE_WEBP = 'image/webp',
}

export const Mime = {
  parse,
  fromString,

  isImage,
  isText,
}

const kKnownMimeTypes = Object.values(MimeType)
