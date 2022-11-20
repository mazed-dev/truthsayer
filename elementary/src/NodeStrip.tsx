/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { BlockQuoteBox, BlockQuotePad } from './editor/components/components'
import { TDoc } from './editor/types'
import { TNode } from 'smuggler-api'

const StripIcon = styled.img``

function NodeStripIcon({
  node,
  className,
}: {
  node: TNode
  className?: string
}) {
  const src =
    node.extattrs?.preview_image?.data ??
    (node.isImage() ? node.getBlobSource() : null)
  if (src == null) {
    return <></>
  }
  return <StripIcon src={src} className={className} />
}

const Title = styled.p`
  font-size: 1em;
  font-weight: 500;
  margin: 0 0 0.4em 0;
`

const BookmarkUrlStripped = ({ url }: { url: string }) => {
  url = url.replace(/^https?:\/\//, '')
  return (
    <p
      css={css`
        font-size: 1em;
        letter-spacing: 0.025em;
        color: #478ac0;
        font-weight: 400;
        line-height: 1em;
        margin: 0 0 0.4em 0;

        width: 248px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `}
    >
      {url}
    </p>
  )
}

const Author = styled.p`
  margin: 0 0 0.4em 0;
  font-size: 1em;
  font-style: italic;
`
const WebBlockQuoteBox = styled(BlockQuoteBox)`
  font-size: 1em;
  padding: 0.3em 0 0.3em 0;
  margin: 0 0 0.4em 0;
`
const WebBlockQuotePad = styled(BlockQuotePad)`
  padding: 0 0.3em 0 0.5em;
  margin: 0 0 0 0.5em;
  font-size: 1em;
`
const Comment = styled.p`
  font-size: 1em;
`

const StripHeadBox = styled.div`
  padding: 0.8em;
`

function NodeStripHead({
  node,
  className,
}: {
  node: TNode
  className?: string
}) {
  if (node.isWebBookmark()) {
    if (node.extattrs?.web != null) {
      const { web, title, author, description } = node.extattrs
      const url = web.url
      // const hostname = new URL(url).hostname
      return (
        <StripHeadBox className={className}>
          <Title>{title}</Title>
          <BookmarkUrlStripped url={url} />
          {author ? <Author>&mdash; {author}</Author> : null}
          {description ? (
            <WebBlockQuoteBox>
              <WebBlockQuotePad cite={url}>{description}</WebBlockQuotePad>
            </WebBlockQuoteBox>
          ) : null}
        </StripHeadBox>
      )
    }
  } else if (node.isWebQuote()) {
    if (node.extattrs?.web_quote != null) {
      const { web_quote, author } = node.extattrs
      const { text, url } = web_quote
      // const quoteUrl = new URL(url)
      // const hostname = quoteUrl.hostname
      return (
        <StripHeadBox className={className}>
          <WebBlockQuoteBox>
            <WebBlockQuotePad cite={url}>{text}</WebBlockQuotePad>
          </WebBlockQuoteBox>
          <BookmarkUrlStripped url={url} />
          {author ? <Author>&mdash; {author}</Author> : null}
        </StripHeadBox>
      )
    }
  }
  const doc = TDoc.fromNodeTextData(node.getText())
  return (
    <StripHeadBox className={className}>
      <Comment>{doc.genTitle(141)}</Comment>
    </StripHeadBox>
  )
}

const Box = styled.div`
  height: 92px;
  width: 368px;
  overflow-y: hidden;
  margin: 1px 4px 1px 4px;

  border: 1px solid #ececec;
  border-radius: 6px;

  display: flex;
  flex-direction: row;
`
export const NodeStrip = ({
  node,
  className,
  onClick,
}: {
  node: TNode
  className?: string
  onClick: () => void
}) => {
  return (
    <Box className={className} onClick={onClick}>
      <NodeStripHead node={node} />
      <NodeStripIcon node={node} css={{ width: '92px', height: '92px' }} />
    </Box>
  )
}
