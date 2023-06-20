/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

const Box = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: auto;

  position: relative;
`

export function PublicPage({ children }: React.PropsWithChildren<{}>) {
  return <Box>{children}</Box>
}
