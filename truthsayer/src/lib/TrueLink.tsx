import React from 'react'
import styled from '@emotion/styled'

import { Link } from 'react-router-dom'
import { TruthsayerPath } from './route'

const Box = styled(Link)``

/**
 * [react-router-dom] style link to the internal pages of Truthsayer,
 * hence the name
 */
export function TruthsayerLink({
  to,
  children,
}: React.PropsWithChildren<{ to: TruthsayerPath }>) {
  return <Box to={to}>{children}</Box>
}
