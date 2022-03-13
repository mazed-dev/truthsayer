import React from 'react'

import { NodeExtattrs, PreviewImageSmall } from 'smuggler-api'
import { Optional } from 'armoury'
import { BlockQuote } from './editor/components/BlockQuote'

import { MdiLaunch } from './MaterialIcons'

import styled from '@emotion/styled'

const Box = styled.div`
  width: 100%;

  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
`

const IconImg = styled.img`
  height: inherit;
  width: inherit;
  border-radius: inherit;
`
const IconImgEmpty = styled.div`
  height: inherit;
  width: inherit;
  border-radius: inherit;
  background-color: rgb(0, 0, 0, 0.04);
`
const PreviewImageBox = styled.div`
  width: 72px;
  height: 72px;
  object-fit: cover;
  padding: 0;
  position: relative;
`

const IconLaunch = styled.a`
  color: inherit;
  cursor: pointer;

  position: absolute;
  bottom: 0;

  font-size: 14px;
  left: 26px;

  opacity: 50%;

  &:hover {
    color: inherit;
    opacity: 100%;
  }
`

const PreviewImage = ({
  icon,
  url,
}: {
  icon: Optional<PreviewImageSmall>
  url?: string
}) => {
  const img = icon == null ? <IconImgEmpty /> : <IconImg src={icon.data} />
  return (
    <PreviewImageBox>
      {img}
      <IconLaunch href={url}>
        <MdiLaunch />
      </IconLaunch>
    </PreviewImageBox>
  )
}

const BadgeBox = styled.div`
  color: inherit;
  text-decoration: none;
  width: 100%;
  display: flex;
`

const TitleBox = styled.div`
  display: inline-block;
  margin: 5px 4px 0 10px;
`

const Title = styled.p`
  font-size: 1em;
  font-weight: 500;

  margin: 0 0 0.36em 0;
`

const Domain = styled.p`
  font-size: 11px;
  letter-spacing: 0.025em;
  color: #80868b;
  font-weight: 400;
  line-height: 1em;

  margin: 0 0 0.42em 0;
`

const Author = styled.p`
  font-size: 11px;
  margin: 0 0 0.42em 0;
`

const DescriptionBox = styled.div`
  font-size: 1em;
  padding: 4px 0 0;
`
const Description = styled(BlockQuote)`
  margin: 4px 0 14px 0;
`

type WebBookmarkProps = {
  extattrs: NodeExtattrs
}

export const WebBookmark = ({ extattrs }: WebBookmarkProps) => {
  const { web, preview_image, title, description, author } = extattrs
  const url = web?.url
  const hostname = url ? new URL(url).hostname : null
  let authorBadge = author ? <Author>{author}</Author> : null
  return (
    <Box>
      <BadgeBox>
        <PreviewImage icon={preview_image || null} url={url} />
        <TitleBox>
          <Title>{title}</Title>
          <Domain>{hostname}</Domain>
          {authorBadge}
        </TitleBox>
      </BadgeBox>
      <DescriptionBox>
        <Description cite={url || ''}>{description}</Description>
      </DescriptionBox>
    </Box>
  )
}
