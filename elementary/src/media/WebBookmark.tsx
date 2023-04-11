/** @jsxImportSource @emotion/react */

import React from 'react'

import { Launch } from '@emotion-icons/material'

import type { NodeExtattrs, PreviewImageSmall } from 'smuggler-api'
import type { Optional } from 'armoury'
import { productanalytics } from 'armoury'
import { log } from 'armoury'
import styled from '@emotion/styled'

import { OverlayCopyOnHover } from '../OverlayCopyOnHover'

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
`

const TitleBox = styled.div`
  display: inline-block;
  margin: 6px 4px 0 6px;
  line-height: 1.3em;
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

  padding: 8px 8px 8px 8px;
  margin: 0;
  color: #5e5e5e;
  /* background: #f8f8f8; */

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
      type: 'match'
      match: string
      prefix: string
      suffix: string
    }

const MatchDescriptionSpan = styled.span`
  text-decoration-line: underline;
  text-decoration-color: #0691ea9c;
  text-decoration-style: solid;
  text-decoration-thickness: 1px;
  &:hover {
    text-decoration-thickness: 2px;
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
  const [hiddenPrefix, visisblePrefix] = React.useMemo(() => {
    const border = -2
    const arr: string[] = prefix.split(' ')
    return [
      `${arr.slice(0, border).join(' ')} `,
      `${arr.slice(border).join(' ')} `,
    ]
  }, [prefix])
  const [visisbleSuffix, hiddenSuffix] = React.useMemo(() => {
    const border = 40
    const arr: string[] = suffix.split(' ')
    return [
      ` ${arr.slice(0, border).join(' ')}`,
      ` ${arr.slice(border).join(' ')}`,
    ]
  }, [suffix])
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
          css={{
            display: seeMore ? 'inline' : 'none',
          }}
        >
          {hiddenPrefix}
        </MatchDescriptionContextSpan>
        <MatchDescriptionContextSpan>
          {visisblePrefix}
        </MatchDescriptionContextSpan>
        <MatchDescriptionSpan>{match}</MatchDescriptionSpan>
        <MatchDescriptionContextSpan>
          {visisbleSuffix}
        </MatchDescriptionContextSpan>
        <MatchDescriptionContextSpan
          css={{
            display: seeMore ? 'inline' : 'none',
          }}
        >
          {hiddenSuffix}
        </MatchDescriptionContextSpan>
        &#8230;{' '}
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
  const [visisble, hidden] = React.useMemo(() => {
    // Show only first N words of the description, hide the rest under the hood
    const border = 54
    const arr: string[] = description.split(' ')
    return [arr.slice(0, border).join(' '), arr.slice(border).join(' ')]
  }, [description])
  return (
    <OverlayCopyOnHover
      getTextToCopy={() => {
        captureMetricOnCopy?.('description')
        return seeMore ? description : visisble
      }}
    >
      <Description cite={url} className={productanalytics.classExclude()}>
        <MatchDescriptionContextSpan>{visisble}</MatchDescriptionContextSpan>
        <MatchDescriptionContextSpan
          css={{
            display: seeMore ? 'inline' : 'none',
          }}
        >
          {hidden}
        </MatchDescriptionContextSpan>
        {!seeMore && !!hidden ? '… ' : ' '}
        {hidden ? (
          <MatchDescriptionSeeMoreBtn
            onClick={() => setSeeMore((more) => !more)}
          >
            see&nbsp;{seeMore ? 'less' : 'more'}
          </MatchDescriptionSeeMoreBtn>
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
    case 'original':
      if (description) {
        return (
          <BookmarkOriginalDescription
            url={url}
            description={description}
            captureMetricOnCopy={captureMetricOnCopy}
          />
        )
      } else {
        return null
      }
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
