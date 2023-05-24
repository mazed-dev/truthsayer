/** @jsxImportSource @emotion/react */

import React from 'react'

import { Launch } from '@emotion-icons/material'

import type { NodeExtattrs, PreviewImageSmall } from 'smuggler-api'
import type { Optional } from 'armoury'
import {
  productanalytics,
  splitStringByWord,
  padNonEmptyStringWithSpaceHead,
  padNonEmptyStringWithSpaceTail,
} from 'armoury'
import { log } from 'armoury'
import styled from '@emotion/styled'

import { CopyFieldHandle } from '../CopyFieldHandle'
import type { ElementaryContext } from '../context'

const Box = styled.div`
  width: 100%;

  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: 0;
`

const IconImg = styled.img`
  height: inherit;
  width: inherit;
  max-width: unset;
  border-radius: inherit;
`
const PreviewImageBox = styled.div`
  width: 72px;
  height: 72px;
  object-fit: cover;
  padding: 0;
  position: relative;
  border-top-left-radius: inherit;
  border-bottom-left-radius: inherit;
`

const IconLaunch = styled.a`
  color: inherit;
  cursor: pointer;

  position: absolute;
  bottom: 0;

  font-size: 1em;
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
  onLaunch,
}: {
  icon: Optional<PreviewImageSmall>
  url?: string
  hostname: string
  onLaunch?: () => void
}) => {
  const img =
    icon == null ? (
      <IconDefault hostname={hostname} />
    ) : (
      <IconImg src={icon.data} />
    )
  return (
    <PreviewImageBox className={productanalytics.classExclude()}>
      {img}
      {url != null ? (
        <IconLaunch href={url} onClick={onLaunch}>
          <Launch size={20} />
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
  border-bottom-left-radius: inherit;
`

const TitleBox = styled.div`
  display: inline-block;
  margin: 6px 4px 0 6px;
  line-height: 1.3em;

  overflow-wrap: break-word;
  word-break: normal;
`

const Title = styled.p`
  font-size: 1em;
  font-weight: 500;
  margin: 0 0 4px 0;
`

const BookmarkUrlStrippedBox = styled.a`
  display: inline-block;
  font-size: 0.88em;
  letter-spacing: 0.025em;
  color: #478ac0;
  font-weight: 400;
  line-height: 1em;

  width: 18em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
`

const BookmarkUrlStripped = ({
  ctx,
  url,
  className,
}: {
  ctx: ElementaryContext
  url: string
  className?: string
}) => {
  const urlToShow = url.replace(/^https?:\/\//, '').replace(/^www\./, '')
  return (
    <BookmarkUrlStrippedBox
      className={className}
      href={url}
      onClick={() => {
        ctx.analytics?.capture("URL:Go to Bookmark's Native Version", {
          'Event type': 'click',
        })
      }}
    >
      {urlToShow}
    </BookmarkUrlStrippedBox>
  )
}

const Author = styled.p`
  margin: 0.25em 0 0.25em 0;
  font-size: 0.84em;
  font-style: italic;
`

const Description = styled.blockquote`
  font-size: 1em;
  line-height: 142%;
  overflow-wrap: break-word;
  word-break: normal;

  padding: 10px 10px 0 10px;
  margin: 0;
  color: inherit;

  quotes: '“' '”' '‘' '’';
  &:before {
    content: open-quote;
  }
  &:after {
    content: close-quote;
  }
`

export type WebBookmarkDescriptionConfig =
  | {
      type: 'original' // default
    }
  | {
      type: 'original-cutted'
    }
  | {
      type: 'none'
    }
  | {
      type: 'match'
      match: string
      prefix: string
      suffix: string
    }

const MatchDescriptionSpan = styled.span`
  text-decoration-line: underline;
  text-decoration-color: rgba(0, 110, 237, 0.64);
  text-decoration-style: solid;
  text-decoration-thickness: 2px;
  &:hover {
    text-decoration-color: rgba(0, 110, 237, 0.92);
  }
`
const MatchDescriptionContextSpan = styled.span``
const MatchDescriptionSeeMoreBtn = styled.span`
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`

const BookmarkMatchDescription = ({
  ctx,
  url,
  match,
  prefix,
  suffix,
}: {
  ctx: ElementaryContext
  url: string
  match: string
  prefix: string
  suffix: string
}) => {
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  return (
    <Description cite={url} className={productanalytics.classExclude()}>
      {!seeMore ? (
        <MatchDescriptionContextSpan>{match}</MatchDescriptionContextSpan>
      ) : (
        <>
          <MatchDescriptionContextSpan>
            {padNonEmptyStringWithSpaceTail(prefix)}
          </MatchDescriptionContextSpan>
          <MatchDescriptionSpan>{match}</MatchDescriptionSpan>
          <MatchDescriptionContextSpan>
            {padNonEmptyStringWithSpaceHead(suffix)}
          </MatchDescriptionContextSpan>
        </>
      )}
      &nbsp;
      <MatchDescriptionSeeMoreBtn
        onClick={() => {
          ctx.analytics?.capture('Button:See More', { more: !seeMore })
          setSeeMore((more) => !more)
        }}
      >
        see&nbsp;{seeMore ? 'less' : 'more'}
      </MatchDescriptionSeeMoreBtn>
    </Description>
  )
}

const BookmarkOriginalDescription = ({
  ctx,
  url,
  description,
}: {
  ctx: ElementaryContext
  url: string
  description: string
}) => {
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  const [visible, hidden] = React.useMemo(
    () => splitStringByWord(description, 220),
    [description]
  )
  return (
    <Description cite={url} className={productanalytics.classExclude()}>
      <MatchDescriptionContextSpan>{visible}</MatchDescriptionContextSpan>
      {hidden ? (
        <>
          <MatchDescriptionContextSpan
            css={{ display: seeMore ? 'inline' : 'none' }}
          >
            {padNonEmptyStringWithSpaceHead(hidden)}
          </MatchDescriptionContextSpan>
          {!seeMore ? '… ' : ' '}
          <MatchDescriptionSeeMoreBtn
            onClick={() => {
              ctx.analytics?.capture('Button:See More', { more: !seeMore })
              setSeeMore((more) => !more)
            }}
          >
            see&nbsp;{seeMore ? 'less' : 'more'}
          </MatchDescriptionSeeMoreBtn>
        </>
      ) : null}
    </Description>
  )
}

const BookmarkDescription = ({
  ctx,
  url,
  description,
  webBookmarkDescriptionConfig,
}: {
  ctx: ElementaryContext
  url: string
  description?: string
  webBookmarkDescriptionConfig: WebBookmarkDescriptionConfig
}) => {
  switch (webBookmarkDescriptionConfig.type) {
    case 'none':
      return null
    case 'original':
      if (!description) {
        return null
      }
      return (
        <Description cite={url} className={productanalytics.classExclude()}>
          {description}
        </Description>
      )
    case 'original-cutted':
      if (!description) {
        return null
      }
      return (
        <BookmarkOriginalDescription
          ctx={ctx}
          url={url}
          description={description}
        />
      )
    case 'match':
      const { match, prefix, suffix } = webBookmarkDescriptionConfig
      return (
        <BookmarkMatchDescription
          ctx={ctx}
          url={url}
          match={match}
          prefix={prefix}
          suffix={suffix}
        />
      )
  }
}

type WebBookmarkProps = {
  ctx: ElementaryContext
  extattrs: NodeExtattrs
  className?: string
  strippedRefs?: boolean
  onLaunch?: () => void
  webBookmarkDescriptionConfig?: WebBookmarkDescriptionConfig
}

export const WebBookmark = ({
  ctx,
  extattrs,
  className,
  strippedRefs,
  onLaunch,
  webBookmarkDescriptionConfig,
}: WebBookmarkProps) => {
  const { web, preview_image, title, description, author } = extattrs
  if (web == null) {
    log.debug('Empty web bookmark node')
    return null
  }
  const url = web.url
  const hostname = new URL(url).hostname
  const authorBadge = author ? (
    <Author className={productanalytics.classExclude()}>
      &mdash; {author}
    </Author>
  ) : null
  return (
    <Box className={className}>
      <BadgeBox>
        <PreviewImage
          icon={preview_image || null}
          url={strippedRefs ? undefined : url}
          hostname={hostname}
          onLaunch={onLaunch}
        />
        <TitleBox>
          <Title className={productanalytics.classExclude()}>{title}</Title>
          <CopyFieldHandle
            ctx={ctx}
            analytics={{ subject: 'url' }}
            getTextToCopy={() => url}
            disabled={strippedRefs}
          >
            <BookmarkUrlStripped
              ctx={ctx}
              className={productanalytics.classExclude()}
              url={url}
            />
          </CopyFieldHandle>
          {authorBadge}
        </TitleBox>
      </BadgeBox>
      <BookmarkDescription
        ctx={ctx}
        url={url}
        description={description}
        webBookmarkDescriptionConfig={
          webBookmarkDescriptionConfig ?? { type: 'original' }
        }
      />
    </Box>
  )
}
