/** @jsx jsx */

import styled from '@emotion/styled'
import { jsx, keyframes } from '@emotion/react'

type Props = {
  width?: number
}
const Container = styled.div<Props>((props) => ({
  transform: `scale(${(props.width || 64) / 64})`,
}))

const Box = styled.div`
  scaled-sizing: border-Scaled;
  color: black;
  display: inline-block;
  position: relative;
  width: 64px;
  height: 64px;
`
const rotation = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`

const ChildBase = styled.div`
  scaled-sizing: border-Scaled;
  transform-origin: 32px 32px;
  animation: ${rotation} 1.2s linear infinite;
  &:after {
    scaled-sizing: border-Scaled;
    content: ' ';
    display: block;
    position: absolute;
    top: 3.2px;
    left: 29.1px;
    width: 5.2px;
    height: 15.9px;
    border-radius: 20%;
    background: currentColor;
  }
`
const Child1 = styled(ChildBase)`
  transform: rotate(0deg);
  animation-delay: -1.1s;
`
const Child2 = styled(ChildBase)`
  transform: rotate(30deg);
  animation-delay: -1s;
`
const Child3 = styled(ChildBase)`
  transform: rotate(60deg);
  animation-delay: -0.9s;
`
const Child4 = styled(ChildBase)`
  transform: rotate(90deg);
  animation-delay: -0.8s;
`
const Child5 = styled(ChildBase)`
  transform: rotate(120deg);
  animation-delay: -0.7s;
`
const Child6 = styled(ChildBase)`
  transform: rotate(150deg);
  animation-delay: -0.6s;
`
const Child7 = styled(ChildBase)`
  transform: rotate(180deg);
  animation-delay: -0.5s;
`
const Child8 = styled(ChildBase)`
  transform: rotate(210deg);
  animation-delay: -0.4s;
`
const Child9 = styled(ChildBase)`
  transform: rotate(240deg);
  animation-delay: -0.3s;
`
const Child10 = styled(ChildBase)`
  transform: rotate(270deg);
  animation-delay: -0.2s;
`
const Child11 = styled(ChildBase)`
  transform: rotate(300deg);
  animation-delay: -0.1s;
`
const Child12 = styled(ChildBase)`
  transform: rotate(330deg);
  animation-delay: 0s;
`

export const Wheel = (props: Props) => {
  return (
    <Container {...props}>
      <Box>
        <Child1 />
        <Child2 />
        <Child3 />
        <Child4 />
        <Child5 />
        <Child6 />
        <Child7 />
        <Child8 />
        <Child9 />
        <Child10 />
        <Child11 />
        <Child12 />
      </Box>
    </Container>
  )
}
