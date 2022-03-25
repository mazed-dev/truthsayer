/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

const Box = styled.div({
  width: '100%',

  margin: 0,
  padding: 0, // '14px 14px 0 14px',

  minHeight: '10rem',
  // boxShadow: '0px 1px 2px 1px rgb(0, 0, 0, 0.12)',
  border: '1px solid #eee',
  borderRadius: '8px',

  fontSize: '14px',
})

type WideCardProps = React.PropsWithChildren<{
  className?: string
}>

export const WideCard = ({ children, className }: WideCardProps) => {
  return <Box className={className}>{children}</Box>
}
