import React from 'react'
import styled from '@emotion/styled'

import { Button } from 'react-bootstrap'

import { HoverTooltip, MdiMoreHoriz } from 'elementary'

const IconEllipsis = styled(MdiMoreHoriz)`
  vertical-align: middle;
`

const Box = styled(Button)`
  background-color: #ffffff;

  border-style: solid;
  border-width: 0px;
  border-radius: 56px;

  opacity: 0.5;

  padding: 3px;
  margin: 4px;

  &:hover {
    opacity: 1;
    background-color: #d0d1d2;
  }
`

export const MeatballsButton = React.forwardRef(
  (
    {
      children,
      onClick,
      className,
    }: React.PropsWithChildren<{
      onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
      className?: string
    }>,
    ref
  ) => (
    <Box
      variant="light"
      className={className}
      ref={ref}
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault()
        onClick(e)
      }}
    >
      {children}
      <HoverTooltip tooltip={'More'}>
        <IconEllipsis />
      </HoverTooltip>
    </Box>
  )
)
