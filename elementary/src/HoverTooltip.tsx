import React from 'react'
import { default as styled } from '@emotion/styled'

const Box = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  z-index: 1000;
  span {
    position: absolute;

    border-radius: 4px;
    max-width: 164px;
    padding: 4px 8px 4px 8px;

    /* Position */
    right: -100%;
    top: 150%;

    /* Text */
    text-align: center;
    line-height: 1rem;
    font-size: small;

    background-color: #494949;
    color: #ffffff;

    opacity: 1;

    visibility: hidden;
  }

  &:hover span {
    visibility: visible;
  }
`

type HoverTooltipProps = React.PropsWithChildren<{
  tooltip: string
  className?: string
}>

// https://www.w3schools.com/css/css_tooltip.asp
export const HoverTooltip = ({
  tooltip,
  children,
  className,
}: HoverTooltipProps) => {
  return (
    <Box className={className}>
      <span>{tooltip}</span>
      {children}
    </Box>
  )
}
