import React from 'react'

import type { NodeExtattrs } from 'smuggler-api'
import { Mime, log } from 'armoury'
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

const Quotation = styled(BlockQuote)`
  margin: 0;
  padding: 10px 8px 10px 0;
`

const RefBox = styled.p`
  margin: 2px 10px 0 0;
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
  font-size: 14px;
  vertical-align: middle;
`

export const WebQuote = ({
  extattrs,
  nid,
  className,
  strippedRefs,
}: {
  extattrs: NodeExtattrs
  nid: string
  className?: string
  strippedRefs?: boolean
}) => {
  const { web_quote, author, content_type } = extattrs
  const authorElement = author ? <Author>&mdash; {author} </Author> : null
  if (web_quote == null) {
    return null
  }
  if (content_type !== Mime.TEXT_PLAIN_UTF_8) {
    log.debug(`Can not render quotation of type ${content_type}, skip it.`)
    return null
  }
  const { text, url } = web_quote
  const quoteUrl = new URL(url)
  quoteUrl.hash = nid
  const hostname = quoteUrl.hostname
  return (
    <Box className={className}>
      <Quotation cite={web_quote.url}>{text}</Quotation>
      {strippedRefs ? null : (
        <RefBox>
          <RefLink href={quoteUrl.toString()}>
            {authorElement}
            {hostname}
            <RefLinkIcon />
          </RefLink>
        </RefBox>
      )}
    </Box>
  )
}
