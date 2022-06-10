/** @jsxImportSource @emotion/react */

import React from 'react'
import { default as styled } from '@emotion/styled'

import { kCardBorder } from './colour.js'

const Box = styled.div`
  width: 100%;

  margin: 0;
  padding: 0;

  min-height: 10rem;
  border-radius: 8px;
  ${kCardBorder};

  font-size: 14px;
`

type WideCardProps = React.PropsWithChildren<{
  className?: string
}>

export const WideCard = ({ children, className }: WideCardProps) => {
  return <Box className={className}>{children}</Box>
}
