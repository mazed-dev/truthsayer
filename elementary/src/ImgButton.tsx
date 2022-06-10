import React from 'react'

import { Button } from 'react-bootstrap'

import { default as styled } from '@emotion/styled'

const Box = styled(Button)`
  background-color: #ffffff;

  border-style: solid;
  border-width: 0;
  border-radius: 4em;

  opacity: 0.5;

  padding: 0.5em;

  &:hover {
    opacity: 1;
    background-color: #d0d1d2;
  }
`

type ImgButtonProps = React.PropsWithChildren<{
  onClick: React.MouseEventHandler
  className?: string
  is_disabled?: boolean
}>

export const ImgButton = React.forwardRef<HTMLButtonElement, ImgButtonProps>(
  ({ children, onClick, className, is_disabled, ...kwargs }, ref) => (
    <Box
      variant="light"
      className={className}
      ref={ref}
      disabled={is_disabled || false}
      onClick={(e: any) => {
        if (onClick) {
          e.preventDefault()
          onClick(e)
        }
      }}
      {...kwargs}
    >
      {children}
    </Box>
  )
)
