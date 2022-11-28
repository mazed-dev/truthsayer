/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

/**
 * +-------------------+
 * | Card outstyle     |
 * |+-----------------+|
 * || ShrinkCard      ||
 * ||+---------------+||
 * ||| Document card |||
 * |||               |||
 * ||+---------------+||
 * |+-----------------+|
 * +-------------------+
 */

type ShrinkCardProps = React.PropsWithChildren<{
  showMore?: boolean
  className?: string
  onClick?: (event: React.MouseEvent<Element, MouseEvent>) => void
  height?: string
}>

const Fade = styled.div`
  position: absolute;
  bottom: 0px;
  display: block;
  width: 100%;
  height: 12px;
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 1) 100%
  );
  border-radius: inherit;
  z-index: 800;
`

const Shrinkable = styled.div`
  overflow-y: hidden;
  position: relative;
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
`

export const ShrinkCard = ({
  children,
  showMore,
  className,
  onClick,
  height,
}: ShrinkCardProps) => {
  const shrinkStyle = showMore
    ? css`
        min-height: ${height};
      `
    : css`
        height: ${height};
      `
  return (
    <Shrinkable onClick={onClick} css={shrinkStyle} className={className}>
      {children}
      <Fade />
    </Shrinkable>
  )
}
