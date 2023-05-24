/** @jsxImportSource @emotion/react */

import React from 'react'

import type { TNode, PreviewImageSmall, NodeBlockKey } from 'smuggler-api'
import {
  nodeBlockKeyToString,
  getNextBlockKey,
  getPrevBlockKey,
  TextContentBlock,
} from 'smuggler-api'
import type { Optional } from 'armoury'
import { getNodeBlock } from '../editor/types'
import {
  productanalytics,
  splitStringByWord,
  padNonEmptyStringWithSpaceHead,
} from 'armoury'
import { log, truncatePretty } from 'armoury'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

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
    hostname = hostname.slice(4)
  }
  const letter = hostname.slice(0, 1).toUpperCase()
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
  hostname,
}: {
  icon: Optional<PreviewImageSmall>
  hostname: string
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

const DirectQuote = styled.div`
  font-size: 1em;
  line-height: 142%;
  overflow-wrap: break-word;
  word-break: normal;
  padding: 10px 10px 0 10px;
  margin: 0;
  color: inherit;
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
      type: 'direct-quotes'
      blocks: NodeBlockKey[]
    }

const ContextBlockBase = styled.div`
  font-size: 12px;
  text-indent: 12px;
  margin: 0 0 4px 0;
`
const ContextBlockFirstStyles = css`
  text-indent: 0px;
  &:before {
    content: '“';
    color: #478ac0;
    display: inline-block;
    vertical-align: bottom;
    font-size: 2em;
    top: 0.1em;
    position: relative;
    width: 12px;
    text-indent: 0;
  }
`
const ContextBlockLastStyles = css`
  &:after {
    content: '”';
    color: #478ac0;
    display: inline-block;
    vertical-align: bottom;
    font-size: 2em;
    top: 0.1em;
    position: relative;
    width: 12px;
    text-indent: 0;
  }
`
const ContextBlockParagraphBox = styled(ContextBlockBase.withComponent('p'))`
  text-align: justify;
`
const ContextBlockHeaderBox = styled(ContextBlockBase.withComponent('h3'))`
  font-weight: 600;
`
const ContextBlockListItemBox = ContextBlockBase.withComponent('div')

const ContextBlock = ({
  block,
  className,
}: {
  block?: TextContentBlock
  className?: string
}) => {
  if (block == null) {
    return null
  }
  switch (block.type) {
    case 'P':
      return (
        <ContextBlockParagraphBox className={className}>
          {block.text}
        </ContextBlockParagraphBox>
      )
    case 'H':
      return (
        <ContextBlockHeaderBox className={className}>
          {block.text}
        </ContextBlockHeaderBox>
      )
    case 'LI':
      return (
        <ContextBlockListItemBox className={className}>
          {block.text}
        </ContextBlockListItemBox>
      )
  }
}
const MatchedContentBlock = styled(ContextBlock)`
  text-decoration-line: underline;
  text-decoration-color: rgba(0, 110, 237, 0.2);
  text-decoration-style: solid;
  text-decoration-thickness: 2px;
  &:hover {
    text-decoration-color: rgba(0, 110, 237, 0.5);
  }
`
const MatchDescriptionContextSpan = styled.span``

const DirectQuoteSeeMoreToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
`
const MatchDescriptionSeeMoreBtn = styled.span`
  cursor: pointer;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`

const BookmarkMatchDescription = ({
  node,
  block,
}: {
  node: TNode
  block: NodeBlockKey
}) => {
  const matchedBlock = getNodeBlock(node, block)
  if (matchedBlock == null) {
    return null
  }
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  if (!seeMore) {
    // https://www.portent.com/blog/seo/featured-snippet-display-lengths-study-portent.htm
    const truncated: TextContentBlock = {
      ...matchedBlock,
      text: truncatePretty(matchedBlock.text, 280),
    }
    return (
      <DirectQuote className={productanalytics.classExclude()}>
        <div>
          <ContextBlock
            block={truncated}
            css={[ContextBlockFirstStyles, ContextBlockLastStyles]}
          />
        </div>
        <DirectQuoteSeeMoreToolbar>
          <MatchDescriptionSeeMoreBtn onClick={() => setSeeMore(true)}>
            See&nbsp;more
          </MatchDescriptionSeeMoreBtn>
        </DirectQuoteSeeMoreToolbar>
      </DirectQuote>
    )
  } else {
    const prefixKey = getPrevBlockKey(block, node)
    const prefix = prefixKey ? getNodeBlock(node, prefixKey) : undefined
    const suffixKey = getNextBlockKey(block, node)
    let suffix = suffixKey ? getNodeBlock(node, suffixKey) : undefined
    if (suffix?.type === 'H') {
      suffix = undefined
    }
    return (
      <DirectQuote className={productanalytics.classExclude()}>
        <div>
          <ContextBlock block={prefix} css={ContextBlockFirstStyles} />
          <MatchedContentBlock block={matchedBlock} />
          <ContextBlock block={suffix} css={ContextBlockLastStyles} />
        </div>
        <DirectQuoteSeeMoreToolbar>
          <MatchDescriptionSeeMoreBtn onClick={() => setSeeMore(false)}>
            See&nbsp;less
          </MatchDescriptionSeeMoreBtn>
        </DirectQuoteSeeMoreToolbar>
      </DirectQuote>
    )
  }
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
  node,
  webBookmarkDescriptionConfig,
}: {
  ctx: ElementaryContext
  url: string
  node: TNode
  webBookmarkDescriptionConfig: WebBookmarkDescriptionConfig
}) => {
  switch (webBookmarkDescriptionConfig.type) {
    case 'none':
      return null
    case 'original':
      if (!node.extattrs?.description) {
        return null
      }
      return (
        <Description cite={url} className={productanalytics.classExclude()}>
          {node.extattrs.description}
        </Description>
      )
    case 'original-cutted':
      if (!node.extattrs?.description) {
        return null
      }
      return (
        <BookmarkOriginalDescription
          ctx={ctx}
          url={url}
          description={node.extattrs.description}
        />
      )
    case 'direct-quotes': {
      const blocks = webBookmarkDescriptionConfig.blocks
      // Sort in order of occurrences in the document to make sure quotes from
      // the top of the document comes first.
      blocks
        .filter((block) => block.field === 'web-text')
        .sort((a, b) => {
          if (a.field === 'web-text' && b.field === 'web-text') {
            return a.index - b.index
          }
          return 0
        })
      return (
        <>
          {webBookmarkDescriptionConfig.blocks.map((block) => (
            <BookmarkMatchDescription
              node={node}
              block={block}
              key={nodeBlockKeyToString(block)}
            />
          ))}
        </>
      )
    }
  }
}

type WebBookmarkProps = {
  ctx: ElementaryContext
  node: TNode
  className?: string
  strippedRefs?: boolean
  webBookmarkDescriptionConfig?: WebBookmarkDescriptionConfig
}

export const WebBookmark = ({
  ctx,
  node,
  className,
  strippedRefs,
  webBookmarkDescriptionConfig,
}: WebBookmarkProps) => {
  if (node.extattrs?.web == null) {
    log.debug('Empty web bookmark node')
    return null
  }
  const { web, preview_image, title, author } = node.extattrs
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
        <PreviewImage icon={preview_image || null} hostname={hostname} />
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
        node={node}
        webBookmarkDescriptionConfig={
          webBookmarkDescriptionConfig ?? { type: 'original' }
        }
      />
    </Box>
  )
}
