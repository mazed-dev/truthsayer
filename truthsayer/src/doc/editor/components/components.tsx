import styled from '@emotion/styled'
import {css} from '@emotion/react'

import { Link as ReactRouterLink } from 'react-router-dom'

const InlineLink = css`
  font-weight: 500;
  color: #38b000;
  text-decoration-line: none;

  &:hover {
    color: #70e000;
    text-decoration-line: underline;
    cursor: pointer;
  }
`

export const InlineLinkExt = styled.a`
  ${InlineLink};
  &:before {
    content: '🌍 ';
    opacity: 0.7;
  }
`

export const InlineLinkNode = styled(ReactRouterLink)`
  ${InlineLink};
  &:before {
    content: '📄 ';
    opacity: 0.7;
  }
`

export const Blockquote = styled.blockquote`
  padding: 5px;
  background: #eeeeeea5;
  border-radius: 5px;
  font-style: italic;

  &:after {
    content: '\\201D';
  }
  &:before {
    content: '\\201C';
  }
`

export const CodeBlockBox = styled.code`
  margin: 0;
  padding: 6px 12px 0 12px;

  background-color: rgb(246, 248, 250);
  color: black;

  font-family: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace';
  direction: ltr;
  font-weight: 400;
  display: block;

  &:first-of-type {
    border-radius: 6px 6px 0 0;
  }

  &:last-of-type {
    border-radius: 0 0 6px 6px;
    margin-top: 0;
    margin-bottom: 1em;
  }
`
