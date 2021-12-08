import React from 'react'

import { PreviewImageSmall } from 'smuggler-api'

import { Optional } from '../../util/types'

type WebBookmarkProps = {
  url: string
  preview_image: Optional<PreviewImageSmall>
  title: Optional<string>
  description: Optional<string>
  lang: Optional<string>
  author: Optional<string>
}

export const WebBookmark = ({
  url,
  preview_image,
  title,
  description,
  lang,
  author,
}: WebBookmarkProps): JSX.Element => {
  return (
    <div>
      <p>{url || ''}</p>
      <p>{preview_image?.content_type || ''}</p>
      <p>{title || ''}</p>
      <p>{description || ''}</p>
      <p>{lang || ''}</p>
      <p>{author || ''}</p>
    </div>
  )
}
