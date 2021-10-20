/**
 * This file is intended for declaring type definitions that help
 * work with Google's Material Design libraries
 */
import React from 'react'
import { jcss } from './jcss'

/**
 * A non-exhaustive list of valid icon ligatures from
 * https://google.github.io/material-design-icons/ font
 */
export type MaterialIconType =
  | 'add'
  | 'bookmark_add'
  | 'code'
  | 'content_copy'
  | 'expand_less'
  | 'expand_more'
  | 'file_upload'
  | 'format_bold'
  | 'format_italic'
  | 'format_list_bulleted'
  | 'format_list_numbered'
  | 'format_quote'
  | 'format_underlined'
  | 'launch'
  | 'looks_one'
  | 'looks_two'
  | 'more_horiz'
  | 'open_in_full'
  | 'search'

type MaterialIconAttrs = React.HTMLProps<HTMLSpanElement>

type NamedMaterialIconAttrs = {
  type: MaterialIconType
} & MaterialIconAttrs

export const MaterialIcon = React.forwardRef<
  HTMLSpanElement,
  NamedMaterialIconAttrs
>(({ type, className, key }, ref) => (
  <span className={jcss('material-icons', className)} key={key} ref={ref}>
    {type}
  </span>
))

const _makeMaterialIcon = (type: MaterialIconType) => {
  return React.forwardRef<HTMLSpanElement, MaterialIconAttrs>(
    ({ className, key }: MaterialIconAttrs, ref) => (
      <MaterialIcon type={type} className={className} key={key} ref={ref} />
    )
  )
}

export const MdiFormatBold = _makeMaterialIcon('format_bold')
export const MdiFormatItalic = _makeMaterialIcon('format_italic')
export const MdiFormatUnderlined = _makeMaterialIcon('format_underlined')
export const MdiCode = _makeMaterialIcon('code')
export const MdiLooksOne = _makeMaterialIcon('looks_one')
export const MdiLooksTwo = _makeMaterialIcon('looks_two')
export const MdiFormatQuote = _makeMaterialIcon('format_quote')
export const MdiFormatListNumbered = _makeMaterialIcon('format_list_numbered')
export const MdiFormatListBulleted = _makeMaterialIcon('format_list_bulleted')
export const MdiExpandLess = _makeMaterialIcon('expand_less')
export const MdiExpandMore = _makeMaterialIcon('expand_more')
export const MdiLaunch = _makeMaterialIcon('launch')
export const MdiMoreHoriz = _makeMaterialIcon('more_horiz')
export const MdiOpenInFull = _makeMaterialIcon('open_in_full')
export const MdiAdd = _makeMaterialIcon('add')
export const MdiContentCopy = _makeMaterialIcon('content_copy')
export const MdiFileUpload = _makeMaterialIcon('file_upload')
export const MdiSearch = _makeMaterialIcon('search')
export const MdiBookmarkAdd = _makeMaterialIcon('bookmark_add')
