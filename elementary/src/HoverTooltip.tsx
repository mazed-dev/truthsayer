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
  transitionDelaySec?: number
}

function getPlacementStyle(placement: Placement): string {
  // FIXME(Alexander): I did not test placements other than 'bottom' very well,
  // feel free to adjust numbers
  switch (placement) {
    case 'top':
      return 'top: 0; transform: translate(-50%, 0);'
    case 'top-left':
      return 'top: -200%; right: 0;'
    case 'top-right':
      return 'top: -200%; left: 0;'
    case 'bottom':
      return 'bottom: 0; transform: translate(-50%, 150%);'
    case 'bottom-left':
      return 'bottom: -200%; right: 0;'
    case 'bottom-right':
      return 'bottom: -200%; left: 0;'
    default:
      return 'unset'
  }
}

export const HoverTooltipBox = styled.div<Props>`
  display: flex;
  position: relative;
  height: 100%;
  width: 100%;
  z-index: 2000;
  span {
    position: absolute;

    border-radius: 4px;
    width: max-content;
    max-width: 10em;
    padding: 4px 8px 4px 8px;

    /* Position */
    ${(props) => getPlacementStyle(props.placement)}

    /* Text */
    font-size: 12px;
    text-align: center;
    line-height: 1em;

    background-color: #494949;
    color: #ffffff;

    opacity: 1;

    visibility: hidden;
    transition: 0s visibility;
  }

  &:hover:not(:disabled) span,
  &:focus:not(:disabled) span,
  &:active:not(:disabled) span {
    visibility: visible;
    transition-delay: ${(props) => props.transitionDelaySec ?? 0.72}s;
  }
`
export const HoverTooltipOverlay = styled.span``

type HoverTooltipProps = React.PropsWithChildren<{
  tooltip: string
  className?: string
  placement?: Placement
  transitionDelaySec?: number
}>

// https://www.w3schools.com/css/css_tooltip.asp
export const HoverTooltip = ({
  tooltip,
  children,
  className,
  placement,
  transitionDelaySec,
}: HoverTooltipProps) => {
  placement = placement ?? 'bottom'
  return (
    <HoverTooltipBox
      placement={placement}
      transitionDelaySec={transitionDelaySec}
    >
      <HoverTooltipOverlay className={className}>{tooltip}</HoverTooltipOverlay>
      {children}
    </HoverTooltipBox>
  )
}
