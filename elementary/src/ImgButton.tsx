import React from 'react'

import { Button } from 'react-bootstrap'

import styled from '@emotion/styled'

const StyledButton = styled(Button)`
  background-color: #ffffff;
  color: #000000;

  border-style: solid;
  border-width: 0;
  border-radius: 4em;

  opacity: 0.5;

  padding: 0.5em;

  cursor: pointer;
  text-decoration: none;

  &:hover {
    opacity: 1;
    background-color: #d0d1d2;
  }
`

type ImgButtonProps = React.PropsWithChildren<{
  onClick?: React.MouseEventHandler
  className?: string
  is_disabled?: boolean
  href?: string
}>

export const ImgButton = React.forwardRef<HTMLButtonElement, ImgButtonProps>(
  ({ children, onClick, className, is_disabled, ...kwargs }, ref) => (
    <StyledButton
      variant="light"
      className={className}
      ref={ref}
      disabled={is_disabled || false}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick(e)
        }
      }}
      {...kwargs}
    >
      {children}
    </StyledButton>
  )
)
