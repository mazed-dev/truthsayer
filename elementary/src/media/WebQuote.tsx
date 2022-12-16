import React from 'react'

import type { NodeExtattrs } from 'smuggler-api'
import { log, MimeType, productanalytics } from 'armoury'
import { BlockQuoteBox, BlockQuotePad } from '../editor/components/components'

import { MdiLaunch } from '../MaterialIcons'

import styled from '@emotion/styled'

const Box = styled.div`
  width: 100%;

  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
`

const RefBox = styled.p`
  margin: 2px 1em 0 0;
  padding: 0;
  text-align: right;
`

const RefLink = styled.a`
  letter-spacing: 0.025em;
  color: #80868b;
  line-height: 1em;
  font-size: 11px;
  font-weight: 400;
  text-decoration: none;
  &:hover {
    color: #80868b;
  }
`
const Author = styled.span`
  font-style: italic;
`
const RefLinkIcon = styled(MdiLaunch)`
  margin-left: 4px;
  font-size: 14px !important;
  vertical-align: middle;
`

const WebBlockQuoteBox = styled(BlockQuoteBox)`
  padding: 0.6em 0 5px 0;
  margin: 0;
`
const WebBlockQuotePad = styled(BlockQuotePad)`
  padding: 0 0.8em 0 0.8em;
  margin: 0 0 0 0.8em;
`

export const WebQuote = ({
  extattrs,
  className,
  strippedRefs,
}: {
  extattrs: NodeExtattrs
  className?: string
  strippedRefs?: boolean
}) => {
  const { web_quote, author, content_type } = extattrs
  const authorElement = author ? <Author>&mdash; {author} </Author> : null
  if (web_quote == null) {
    return null
  }
  if (content_type !== MimeType.TEXT_PLAIN_UTF_8) {
    log.debug(`Can not render quotation of type ${content_type}, skip it.`)
    return null
  }
  const { text, url } = web_quote
  const quoteUrl = new URL(url)
  const hostname = quoteUrl.hostname
  return (
    <Box className={className}>
      <WebBlockQuoteBox className={className}>
        <WebBlockQuotePad
          cite={web_quote.url}
          className={productanalytics.classExclude()}
        >
          {text}
        </WebBlockQuotePad>
        {strippedRefs ? null : (
          <RefBox>
            <RefLink
              href={quoteUrl.toString()}
              className={productanalytics.classExclude()}
            >
              {authorElement}
              {hostname}
              <RefLinkIcon />
            </RefLink>
          </RefBox>
        )}
      </WebBlockQuoteBox>
    </Box>
  )
}
