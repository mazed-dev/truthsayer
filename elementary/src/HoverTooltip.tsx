import React from 'react'
import styled from '@emotion/styled'

type Placement =
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
type Props = {
  placement: Placement
}

function getPlacementStyle(placement: Placement): string {
  switch (placement) {
    case 'top':
      return 'top: -300%;'
    case 'top-left':
      return 'top: -300%; right: 0;'
    case 'top-right':
      return 'top: -300%; left: 0;'
    case 'bottom':
      return 'bottom: -300%;'
    case 'bottom-left':
      return 'bottom: -300%; right: 0;'
    case 'bottom-right':
      return 'bottom: -300%; left: 0;'
    default:
      return 'unset'
  }
}

const Box = styled.div<Props>`
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
    ${(props) => getPlacementStyle(props.placement)}

    /* Text */
    text-align: center;
    line-height: 1rem;
    font-size: small;

    background-color: #494949;
    color: #ffffff;

    opacity: 1;

    visibility: hidden;

    transition: 0s visibility;
  }

  &:hover span {
    visibility: visible;
    transition-delay: 1.2s;
  }
`

type HoverTooltipProps = React.PropsWithChildren<{
  tooltip: string
  className?: string
  placement?: Placement
}>

// https://www.w3schools.com/css/css_tooltip.asp
export const HoverTooltip = ({
  tooltip,
  children,
  className,
  placement,
}: HoverTooltipProps) => {
  placement = placement ?? 'bottom-left'
  return (
    <Box className={className} placement={placement}>
      <span>{tooltip}</span>
      {children}
    </Box>
  )
}
