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

import { OverlayCopyOnHover } from '../OverlayCopyOnHover'

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
  margin: 0 0 4px 0;

  width: 18em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
`

const BookmarkUrlStripped = ({
  url,
  className,
}: {
  url: string
  className?: string
}) => {
  const urlToShow = url.replace(/^https?:\/\//, '').replace(/^www\./, '')
  return (
    <BookmarkUrlStrippedBox className={className} href={url}>
      {urlToShow}
    </BookmarkUrlStrippedBox>
  )
}

const Author = styled.p`
  margin: 0;
  font-size: 0.84em;
  font-style: italic;
`

const Description = styled.blockquote`
  font-size: 1em;
  line-height: 142%;
  overflow-wrap: break-word;
  word-break: normal;

  padding: 8px 8px 8px 8px;
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
  text-decoration-color: #2880b99c;
  text-decoration-color: rgba(0, 110, 237, 0.64);
  text-decoration-style: solid;
  text-decoration-thickness: 1px;
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
  url,
  match,
  prefix,
  suffix,
  captureMetricOnCopy,
}: {
  url: string
  match: string
  prefix: string
  suffix: string
  captureMetricOnCopy?: (subj: string) => void
}) => {
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  const [hiddenPrefix, visisblePrefix] = React.useMemo(
    () => splitStringByWord(prefix, -18),
    [prefix]
  )
  const [visisbleSuffix, hiddenSuffix] = React.useMemo(
    () => splitStringByWord(suffix, 154),
    [suffix]
  )
  return (
    <OverlayCopyOnHover
      getTextToCopy={() => {
        captureMetricOnCopy?.('description')
        return seeMore
          ? [prefix, match, suffix].join(' ')
          : [visisblePrefix, match, visisbleSuffix].join(' ')
      }}
    >
      <Description cite={url} className={productanalytics.classExclude()}>
        &#8230;
        <MatchDescriptionContextSpan
          css={{ display: seeMore ? 'inline' : 'none' }}
        >
          {padNonEmptyStringWithSpaceTail(hiddenPrefix)}
        </MatchDescriptionContextSpan>
        <MatchDescriptionContextSpan>
          {padNonEmptyStringWithSpaceTail(visisblePrefix)}
        </MatchDescriptionContextSpan>
        <MatchDescriptionSpan>{match}</MatchDescriptionSpan>
        <MatchDescriptionContextSpan>
          {padNonEmptyStringWithSpaceHead(visisbleSuffix)}
        </MatchDescriptionContextSpan>
        <MatchDescriptionContextSpan
          css={{ display: seeMore ? 'inline' : 'none' }}
        >
          {padNonEmptyStringWithSpaceHead(hiddenSuffix)}
        </MatchDescriptionContextSpan>
        &#8230;&nbsp;
        <MatchDescriptionSeeMoreBtn onClick={() => setSeeMore((more) => !more)}>
          see&nbsp;{seeMore ? 'less' : 'more'}
        </MatchDescriptionSeeMoreBtn>
      </Description>
    </OverlayCopyOnHover>
  )
}

const BookmarkOriginalDescription = ({
  url,
  description,
  captureMetricOnCopy,
}: {
  url: string
  description: string
  captureMetricOnCopy?: (subj: string) => void
}) => {
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  const [visible, hidden] = React.useMemo(
    () => splitStringByWord(description, 220),
    [description]
  )
  return (
    <OverlayCopyOnHover
      getTextToCopy={() => {
        captureMetricOnCopy?.('description')
        return seeMore ? description : visible
      }}
    >
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
              onClick={() => setSeeMore((more) => !more)}
            >
              see&nbsp;{seeMore ? 'less' : 'more'}
            </MatchDescriptionSeeMoreBtn>
          </>
        ) : null}
      </Description>
    </OverlayCopyOnHover>
  )
}

const BookmarkDescription = ({
  url,
  description,
  webBookmarkDescriptionConfig,
  captureMetricOnCopy,
}: {
  url: string
  description?: string
  webBookmarkDescriptionConfig: WebBookmarkDescriptionConfig
  captureMetricOnCopy?: (subj: string) => void
}) => {
  switch (webBookmarkDescriptionConfig.type) {
    case 'none':
      return null
    case 'original':
      if (!description) {
        return null
      }
      return (
        <OverlayCopyOnHover
          getTextToCopy={() => {
            captureMetricOnCopy?.('description')
            return description
          }}
        >
          <Description cite={url} className={productanalytics.classExclude()}>
            {description}
          </Description>
        </OverlayCopyOnHover>
      )
    case 'original-cutted':
      if (!description) {
        return null
      }
      return (
        <BookmarkOriginalDescription
          url={url}
          description={description}
          captureMetricOnCopy={captureMetricOnCopy}
        />
      )
    case 'match':
      const { match, prefix, suffix } = webBookmarkDescriptionConfig
      return (
        <BookmarkMatchDescription
          url={url}
          match={match}
          prefix={prefix}
          suffix={suffix}
          captureMetricOnCopy={captureMetricOnCopy}
        />
      )
  }
}

type WebBookmarkProps = {
  extattrs: NodeExtattrs
  className?: string
  strippedRefs?: boolean
  onLaunch?: () => void
  captureMetricOnCopy?: (subj: string) => void
  webBookmarkDescriptionConfig?: WebBookmarkDescriptionConfig
}

export const WebBookmark = ({
  extattrs,
  className,
  strippedRefs,
  onLaunch,
  captureMetricOnCopy,
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
    <OverlayCopyOnHover
      getTextToCopy={() => {
        captureMetricOnCopy?.('author')
        return author
      }}
    >
      <Author className={productanalytics.classExclude()}>
        &mdash; {author}
      </Author>
    </OverlayCopyOnHover>
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
          <OverlayCopyOnHover
            getTextToCopy={() => {
              captureMetricOnCopy?.('title')
              return title ?? null
            }}
          >
            <Title className={productanalytics.classExclude()}>{title}</Title>
          </OverlayCopyOnHover>
          <OverlayCopyOnHover
            getTextToCopy={() => {
              captureMetricOnCopy?.('url')
              return url
            }}
          >
            <BookmarkUrlStripped
              className={productanalytics.classExclude()}
              url={url}
            />
          </OverlayCopyOnHover>
          {authorBadge}
        </TitleBox>
      </BadgeBox>
      <BookmarkDescription
        url={url}
        description={description}
        webBookmarkDescriptionConfig={
          webBookmarkDescriptionConfig ?? { type: 'original' }
        }
        captureMetricOnCopy={captureMetricOnCopy}
      />
    </Box>
  )
}
