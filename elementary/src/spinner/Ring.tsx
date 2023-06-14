/** @jsx jsx */

import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const rotation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`
export const Ring = styled.div`
  border: calc(1em / 10) solid #f3f3f3;
  border-radius: 50%;
  border-top: calc(1em / 10) solid #00000000;
  width: 1em;
  height: 1em;
  animation: ${rotation} 1s linear infinite;
  display: flex;
  vertical-align: middle;
`
