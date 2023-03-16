/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

type Props = React.PropsWithChildren<{
  onClick: () => void
  tooltip?: string
}>

const Box = styled.div`
  position: relative;
  &:hover {
  }
`

const OverlayButton: React.FC<Props> = ({ children, onClick }) => {

  return (
    <div style={{ position: 'relative' }} >
      {children}
      {isHovering && (
        <button
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
          onClick={onClick}
        >
          Click me!
        </button>
      )}
    </div>
  )
}
