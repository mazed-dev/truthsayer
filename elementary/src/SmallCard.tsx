/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import { kCardBorder } from './colour'

const _smallCardShadow0 = {}

const _smallCardShadow1 = {
  boxShadow: `
    1px 1px 1px white,
    2px 2px 1px white,
    3px 3px 1px gray`,
}

const _smallCardShadow2 = {
  boxShadow: `
    1px 1px 1px white,
    2px 2px 1px white,
    3px 3px 1px gray,
    4px 4px 1px white,
    5px 5px 1px white,
    6px 6px 1px gray`,
}

const _smallCardShadow3 = {
  boxShadow: `
    1px 1px 1px white,
    2px 2px 1px white,
    3px 3px 1px gray,
    4px 4px 1px white,
    5px 5px 1px white,
    6px 6px 1px gray,
    7px 7px 1px white,
    8px 8px 1px white,
    9px 9px 1px gray`,
}

const _smallCardShadow4 = {
  boxShadow: `
    1px 1px 1px white,
    2px 2px 1px white,
    3px 3px 1px gray,
    4px 4px 1px white,
    5px 5px 1px white,
    6px 6px 1px gray,
    7px 7px 1px white,
    8px 8px 1px white,
    9px 9px 1px gray,
    10px 10px 1px white,
    11px 11px 1px white,
    12px 12px 1px gray`,
}

const _smallCardShadow5 = {
  boxShadow: `
    1px 1px 1px white,
    2px 2px 1px white,
    3px 3px 1px gray,
    4px 4px 1px white,
    5px 5px 1px white,
    6px 6px 1px gray,
    7px 7px 1px white,
    8px 8px 1px white,
    9px 9px 1px gray,
    10px 10px 1px white,
    11px 11px 1px white,
    12px 12px 1px gray,
    13px 13px 1px white,
    14px 14px 1px white,
    15px 15px 1px gray`,
}

function getShadowStyle(n: number) {
  switch (Math.max(0, n) /* treat negative numbers as 0 */) {
    case 0:
      return _smallCardShadow0
    case 1:
      return _smallCardShadow1
    case 2:
      return _smallCardShadow2
    case 3:
      return _smallCardShadow3
    case 4:
      return _smallCardShadow4
    default:
      break
  }
  return _smallCardShadow5
}

export const kSmallCardWidth = 232

const SmallCardBox = styled.div`
  width: ${kSmallCardWidth}px;
  margin: 0;
  padding: 0;
  font-size: 12px;
  border-radius: 5px;
  ${kCardBorder};
`

type SmallCardProps = React.PropsWithChildren<{
  onClick?: React.MouseEventHandler
  className?: string
  stack_size?: number
}>

export const SmallCard = React.forwardRef<HTMLDivElement, SmallCardProps>(
  ({ children, className, onClick, stack_size, ...kwargs }, ref) => {
    let Box = SmallCardBox
    if (onClick) {
      Box = styled(Box)({ '&:hover': { cursor: 'pointer' } })
    }
    Box = styled(Box)(getShadowStyle(stack_size || 0))
    return (
      <Box className={className} ref={ref} onClick={onClick} {...kwargs}>
        {children}
      </Box>
    )
  }
)
