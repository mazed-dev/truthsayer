// @ts-nocheck

import React from 'react'

import { NavLink } from 'react-router-dom'
import styled from '@emotion/styled'

import {
  Header1Box,
  Header2Box,
  Header3Box,
  Header4Box,
  Header5Box,
  Header6Box,
} from './components'

const StdHeader = React.forwardRef(({ depth, ...attributes }, ref) => {
  switch (depth) {
    case 1:
      return <Header1Box ref={ref} {...attributes} />
    case 2:
      return <Header2Box ref={ref} {...attributes} />
    case 3:
      return <Header3Box ref={ref} {...attributes} />
    case 4:
      return <Header4Box ref={ref} {...attributes} />
    case 5:
      return <Header5Box ref={ref} {...attributes} />
    case 6:
      return <Header6Box ref={ref} {...attributes} />
  }
  return <Header6Box ref={ref} {...attributes} />
})

const AnchoredLink = styled(NavLink)`
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

function Anchored({ nid, children }) {
  if (nid) {
    return <AnchoredLink to={`/n/${nid}`}>{children}</AnchoredLink>
  }
  return <>{children}</>
}

function makeStyledHeader(depth) {
  const StyledHeader = React.forwardRef(
    ({ className, children, nid, ...attributes }, ref) => {
      return (
        <StdHeader
          ref={ref}
          className={className}
          depth={depth}
          {...attributes}
        >
          <Anchored nid={nid}>{children}</Anchored>
        </StdHeader>
      )
    }
  )
  return StyledHeader
}

export const Header = makeStyledHeader(2)
export const Header1 = makeStyledHeader(1)
export const Header2 = makeStyledHeader(2)
export const Header3 = makeStyledHeader(3)
export const Header4 = makeStyledHeader(4)
export const Header5 = makeStyledHeader(5)
export const Header6 = makeStyledHeader(6)
