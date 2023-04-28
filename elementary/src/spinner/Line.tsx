/** @jsx jsx */

import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const lineAnim = keyframes`
  0% {
    left: -40%;
  }
  50% {
    left: 20%;
    width: 80%;
  }
  100% {
    left: 100%;
    width: 100%;
  }
`

export const Line = styled.div`
  width: 100px;
  height: 1px;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;

  &:before {
    content: '';
    position: absolute;
    left: -50%;
    height: 1px;
    width: 40%;
    background-color: rgba(0, 110, 237, 0.42);
    animation: ${lineAnim} 1.8s linear infinite;
    border-radius: 20px;
  }
`
