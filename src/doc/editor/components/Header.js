import React from 'react'

import { NavLink } from 'react-router-dom'

import { EditorBlock, DraftEditorBlock } from 'draft-js'

import './components.css'
import styles from './Header.module.css'

import { joinClasses } from '../../../util/elClass.js'

const StdHeader = React.forwardRef((props, ref) => {
  const { depth } = props
  switch (depth) {
    case 1:
      return <h1 {...props} />
    case 2:
      return <h2 {...props} />
    case 3:
      return <h3 {...props} />
    case 4:
      return <h4 {...props} />
    case 5:
      return <h5 {...props} />
    case 6:
      return <h6 {...props} />
  }
  return <h6 {...props} />
})

function Anchored({ nid, children }) {
  if (nid) {
    return (
      <NavLink to={`/n/${nid}`} className={styles.ref}>
        {children}
      </NavLink>
    )
  }
  return <>{children}</>
}

function makeStyledHeader(depth, baseClassName) {
  const StyledHeader = React.forwardRef(
    ({ className, children, nid, ...rest }, ref) => {
      className = joinClasses(baseClassName, className)
      return (
        <StdHeader ref={ref} className={className} depth={depth} {...rest}>
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
