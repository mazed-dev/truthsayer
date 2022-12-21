import React from 'react'
import styled from '@emotion/styled'

import {
  Header1Box,
  Header2Box,
  Header3Box,
  Header4Box,
  Header5Box,
  Header6Box,
} from './components'

const StdHeader = React.forwardRef<
  HTMLHeadingElement,
  React.PropsWithChildren<{ depth: number; className?: string }>
>(({ depth, children, className, ...attributes }, ref) => {
  switch (depth) {
    case 1:
      return (
        <Header1Box ref={ref} className={className}>
          {children}
        </Header1Box>
      )
    case 2:
      return (
        <Header2Box ref={ref} className={className}>
          {children}
        </Header2Box>
      )
    case 3:
      return (
        <Header3Box ref={ref} className={className}>
          {children}
        </Header3Box>
      )
    case 4:
      return (
        <Header4Box ref={ref} className={className}>
          {children}
        </Header4Box>
      )
    case 5:
      return (
        <Header5Box ref={ref} className={className}>
          {children}
        </Header5Box>
      )
    case 6:
      return (
        <Header6Box ref={ref} className={className}>
          {children}
        </Header6Box>
      )
  }
  return (
    <Header6Box ref={ref} className={className} {...attributes}>
      {children}
    </Header6Box>
  )
})

const AnchoredLink = styled.a`
  color: inherit;
  text-decoration: none;
  &:hover {
    color: inherit;
    text-decoration: none;
  }
  &:visited {
    color: inherit;
    text-decoration: none;
  }
`

function Anchored({ nid, children }: React.PropsWithChildren<{ nid: string }>) {
  if (nid) {
    return <AnchoredLink href={`/n/${nid}`}>{children}</AnchoredLink>
  }
  return <>{children}</>
}

function makeStyledHeader(depth: number) {
  const StyledHeader = React.forwardRef<
    HTMLHeadingElement,
    {
      className?: string
      nid: string
    }
  >(({ className, children, nid, ...attributes }, ref) => {
    return (
      <StdHeader ref={ref} className={className} depth={depth} {...attributes}>
        <Anchored nid={nid}>{children}</Anchored>
      </StdHeader>
    )
  })
  return StyledHeader
}

export const Header = makeStyledHeader(2)
export const Header1 = makeStyledHeader(1)
export const Header2 = makeStyledHeader(2)
export const Header3 = makeStyledHeader(3)
export const Header4 = makeStyledHeader(4)
export const Header5 = makeStyledHeader(5)
export const Header6 = makeStyledHeader(6)
