import React from 'react'

import { BlockQuote } from '../editor/components/BlockQuote'
import { MdiLaunch } from '../MaterialIcons'

import type { NodeExtattrs, PreviewImageSmall } from 'smuggler-api'
import type { Optional } from 'armoury'
import { productanalytics } from 'armoury'
import { log } from 'armoury'
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
const PreviewImageBox = styled.div`
  width: 72px;
  height: 72px;
  object-fit: cover;
  padding: 0;
  position: relative;
  border-top-left-radius: inherit;
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
const IconDefaultBox = styled.div`
  height: inherit;
  width: inherit;
  border-radius: inherit;
  background-color: rgb(0, 0, 0, 0.02);
  align-items: center;
  display: flex;
  justify-content: center;
  float: left;
`
const IconDefaultLetter = styled.span`
  color: rgba(0, 0, 0, 0.3);
  cursor: default;
  display: block;
  font-family: 'Comfortaa';
  font-size: 58px;
  font-style: normal;
`

const IconDefault = ({ hostname }: { hostname: string }) => {
  if (hostname.startsWith('www.')) {
    hostname = hostname.substr(4)
  }
  const letter = hostname.substr(0, 1).toUpperCase()
  return (
    <IconDefaultBox>
      <IconDefaultLetter>{letter}</IconDefaultLetter>
    </IconDefaultBox>
  )
}
/**
 * This is a preview image element, we use it to render reference to the orginal
 * web page with "launch" incon rendered over the image as link-button. When
 * `strippedRefs=true` we are not rendering the reference button, only the
 * preview image. This is the only case when url param is `undefined`.
 */
const PreviewImage = ({
  icon,
  url,
  hostname,
}: {
  icon: Optional<PreviewImageSmall>
  url?: string
  hostname: string
}) => {
  const img =
    icon == null ? (
      <IconDefault hostname={hostname} />
    ) : (
      <IconImg src={icon.data} />
    )
  return (
    <PreviewImageBox className={productanalytics.exclude()}>
      {img}
      {url != null ? (
        <IconLaunch href={url}>
          <MdiLaunch />
        </IconLaunch>
      ) : null}
    </PreviewImageBox>
  )
}

const BadgeBox = styled.div`
  color: inherit;
  text-decoration: none;
  width: 100%;
  display: flex;
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
`

const TitleBox = styled.div`
  display: inline-block;
  margin: 8px 4px 0 8px;
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
  margin: 0 0 0.42em 0;
  font-size: 11px;
  font-style: italic;
`

const DescriptionBox = styled.div`
  font-size: 1em;
  padding: 0;
  margin: 8px 8px 0 8px;
`
const Description = styled(BlockQuote)`
  margin: 4px 0 6px 0;
`

type WebBookmarkProps = {
  extattrs: NodeExtattrs
  className?: string
  strippedRefs?: boolean
}

export const WebBookmark = ({
  extattrs,
  className,
  strippedRefs,
}: WebBookmarkProps) => {
  const { web, preview_image, title, description, author } = extattrs
  if (web == null) {
    log.debug('Empty web bookmark node')
    return null
  }
  const url = web.url
  const hostname = new URL(url).hostname
  const authorBadge = author ? (
    <Author className={productanalytics.exclude()}>&mdash; {author}</Author>
  ) : null
  const descriptionElement = description ? (
    <DescriptionBox>
      <Description cite={url} className={productanalytics.exclude()}>
        {description}
      </Description>
    </DescriptionBox>
  ) : null
  return (
    <Box className={className}>
      <BadgeBox>
        <PreviewImage
          icon={preview_image || null}
          url={strippedRefs ? undefined : url}
          hostname={hostname}
        />
        <TitleBox>
          <Title className={productanalytics.exclude()}>{title}</Title>
          <Domain className={productanalytics.exclude()}>{hostname}</Domain>
          {authorBadge}
        </TitleBox>
      </BadgeBox>
      {descriptionElement}
    </Box>
  )
}
