import React from 'react'

import styled from '@emotion/styled'

const ForewordBrandBox = styled.h1`
  font-family: 'Noto+Serif';
  font-style: italic;
  font-size: 26px;
`

export const ForewordName = ({ className }: { className?: string }) => {
  return <ForewordBrandBox className={className}>fore·word</ForewordBrandBox>
}
