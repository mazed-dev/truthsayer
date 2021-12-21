import React from 'react'

import { NodeExtattrs, PreviewImageSmall } from 'smuggler-api'
import { Optional } from '../../util/types'
import { BlockQuote } from '../editor/components/BlockQuote'

import styled from '@emotion/styled'

import * as log from '../../util/log'

const Box = styled.div`
  width: 100%;

  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
`

const IconImg = styled.img`
  width: 70px;
  height: 70px;
  object-fit: cover;

  margin: 0.45em 0.45em 0 0.45em;

  background-color: white;
`
const IconBox = styled.div`
  padding: 0;
`

const Icon = ({ icon }: { icon: Optional<PreviewImageSmall> }) => {
  if (icon) {
    const { data } = icon
    return (
      <IconBox>
        <IconImg src={data} />
      </IconBox>
    )
  }
  return null
}

const BadgeBox = styled.div`
  color: inherit;
  text-decoration: none;
  width: 100%;
  background-color: rgba(250, 250, 250, 0.9);
  display: flex;
  box-shadow: 0 2px 1px -2px gray;
`

const TitleBox = styled.div`
  display: inline-block;
  margin: 0.7em 0.7em 0 0.7em;
`

const Title = styled.p`
  font-size: 1.1em;
  font-weight: 500;

  margin: 0 0 0.36em 0;
`

const Domain = styled.p`
  font-size: 0.75rem;
  letter-spacing: 0.025em;
  color: #80868b;
  font-weight: 400;
  line-height: 1rem;

  margin: 0 0 0.42em 0;
`

const Author = styled.p`
  font-size: 0.75rem;
  margin: 0 0 0.42em 0;
`

const DescriptionBox = styled.div`
  font-size: 1em;
  padding: 0.7em 0.7em 0 0.7em;
`

type WebBookmarkProps = {
  extattrs: NodeExtattrs
}
export const WebBookmark = ({ extattrs }: WebBookmarkProps) => {
  const { web, preview_image, title, description, lang, author } = extattrs
  const url = web?.url
  const hostname = url ? new URL(url).hostname : null
  let authorBadge = author ? <Author>by {author}</Author> : null
  return (
    <Box>
      <BadgeBox>
        <Icon icon={preview_image || null} />
        <TitleBox>
          <Title>{title}</Title>
          <Domain>{hostname}</Domain>
          {authorBadge}
        </TitleBox>
      </BadgeBox>
      <DescriptionBox>
        <BlockQuote cite={url || ''}>{description}</BlockQuote>
      </DescriptionBox>
    </Box>
  )
}
