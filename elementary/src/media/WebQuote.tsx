import React from 'react'

import type { NodeExtattrs, PreviewImageSmall } from 'smuggler-api'
import type { Optional } from 'armoury'
import { BlockQuote } from '../editor/components/BlockQuote'

import { MdiLaunch } from '../MaterialIcons'

import styled from '@emotion/styled'

const Box = styled.div`
  width: 100%;

  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
`

const Author = styled.p`
  font-size: 11px;
  margin: 0 0 0.42em 0;
`

export const WebQuote = ({ extattrs, className }: {
  extattrs: NodeExtattrs
  className?: string
}) => {
  const { web_quote, author, content_type } = extattrs
  if (web_quote == null) { return null }
  const { url, path, plaintext } = web_quote
  const authorBadge = 
  return (
    <Box className={className}>
      <BadgeBox>
        <PreviewImage icon={preview_image || null} url={url} />
        <TitleBox>
          <Title>{title}</Title>
          <Domain>{hostname}</Domain>
          {author ? <Author>{author}</Author> : null}
        </TitleBox>
      </BadgeBox>
      <DescriptionBox>
        <Description cite={url || ''}>{description}</Description>
      </DescriptionBox>
    </Box>
  )
}
