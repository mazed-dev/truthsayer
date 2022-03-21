// @ts-nocheck

import React from 'react'

import {
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeImage,
  kSlateBlockTypeLink,
  kSlateBlockTypeListCheckItem,
  kSlateBlockTypeListItem,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
} from './types'

import {
  Header1,
  Header2,
  Header3,
  Header4,
  Header5,
  Header6,
} from './components/Header'
import { HRule } from './components/HRule'
import { BlockQuote } from './components/BlockQuote'
import { CodeBlock } from './components/CodeBlock'
import { Paragraph } from './components/Paragraph'
import { List } from './components/List'
import { Image } from './components/Image'
import { DateTime } from './components/DateTime'
import { Link } from './components/Link'

export const makeElementRender = (isEditable: boolean) => {
  return React.forwardRef(({ attributes, children, element, nid }, ref) => {
    switch (element.type) {
      case kSlateBlockTypeUnorderedList:
        return (
          <List.Unordered ref={ref} {...attributes}>
            {children}
          </List.Unordered>
        )
      case kSlateBlockTypeOrderedList:
        return (
          <List.Ordered ref={ref} {...attributes}>
            {children}
          </List.Ordered>
        )
      case kSlateBlockTypeListItem:
        return (
          <List.Item ref={ref} {...attributes}>
            {children}
          </List.Item>
        )
      case kSlateBlockTypeListCheckItem:
        return (
          <List.CheckItem
            element={element}
            attributes={attributes}
            isEditable={isEditable}
            ref={ref}
          >
            {children}
          </List.CheckItem>
        )
      case kSlateBlockTypeH1:
        return (
          <Header1 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header1>
        )
      case kSlateBlockTypeH2:
        return (
          <Header2 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header2>
        )
      case kSlateBlockTypeH3:
        return (
          <Header3 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header3>
        )
      case kSlateBlockTypeH4:
        return (
          <Header4 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header4>
        )
      case kSlateBlockTypeH5:
        return (
          <Header5 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header5>
        )
      case kSlateBlockTypeH6:
        return (
          <Header6 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header6>
        )
      case kSlateBlockTypeCode:
        return (
          <CodeBlock ref={ref} {...attributes}>
            {children}
          </CodeBlock>
        )
      case kSlateBlockTypeBreak:
        return (
          <HRule attributes={attributes} element={element} ref={ref}>
            {children}
          </HRule>
        )
      case kSlateBlockTypeQuote:
        return (
          <BlockQuote ref={ref} {...attributes}>
            {children}
          </BlockQuote>
        )
      case kSlateBlockTypeParagraph:
        return (
          <Paragraph ref={ref} {...attributes}>
            {children}
          </Paragraph>
        )
      case kSlateBlockTypeImage:
        return (
          <Image attributes={attributes} element={element} ref={ref}>
            {children}
          </Image>
        )
      case kSlateBlockTypeDateTime:
        return (
          <DateTime attributes={attributes} element={element} ref={ref}>
            {children}
          </DateTime>
        )
      case kSlateBlockTypeLink:
        return (
          <Link attributes={attributes} element={element} ref={ref}>
            {children}
          </Link>
        )
      default:
        return (
          <span ref={ref} {...attributes}>
            {children}
          </span>
        )
    }
  })
}
