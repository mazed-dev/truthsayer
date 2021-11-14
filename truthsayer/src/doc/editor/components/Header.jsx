import React from 'react'

import { NavLink } from 'react-router-dom'

import './components.css'
import styles from './Header.module.css'

import { jcss } from 'elementary'

const StdHeader = React.forwardRef(({ depth, ...attributes }, ref) => {
  switch (depth) {
    case 1:
      return <h1 ref={ref} {...attributes} />
    case 2:
      return <h2 ref={ref} {...attributes} />
    case 3:
      return <h3 ref={ref} {...attributes} />
    case 4:
      return <h4 ref={ref} {...attributes} />
    case 5:
      return <h5 ref={ref} {...attributes} />
    case 6:
      return <h6 ref={ref} {...attributes} />
  }
  return <h6 ref={ref} {...attributes} />
})

function Anchored({ nid, children }) {
  if (nid) {
    return (
      <NavLink to={`/n/${nid}`} className={styles.link}>
        {children}
      </NavLink>
    )
  }
  return <>{children}</>
}

function makeStyledHeader(depth, baseClassName) {
  const StyledHeader = React.forwardRef(
    ({ className, children, nid, ...attributes }, ref) => {
      className = jcss(baseClassName, className)
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

export const Header = makeStyledHeader(1, 'doc_block_header_1')
export const Header1 = makeStyledHeader(1, 'doc_block_header_1')
export const Header2 = makeStyledHeader(2, 'doc_block_header_2')
export const Header3 = makeStyledHeader(3, 'doc_block_header_3')
export const Header4 = makeStyledHeader(4, 'doc_block_header_4')
export const Header5 = makeStyledHeader(5, 'doc_block_header_5')
export const Header6 = makeStyledHeader(6, 'doc_block_header_6')
