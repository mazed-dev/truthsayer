/** @jsxImportSource @emotion/react */

import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import { LogoSmall } from './../style'

const OuterBox = styled.div`
  position: absolute;
  display: contents;
`
const Box = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;

  user-select: none;
  cursor: pointer;

  z-index: 1024;
`

const Logo = styled(LogoSmall)`
  margin: 0;
  padding: 0;
`

const BadgeBox = styled.div`
  position: static;
`

const BadgeBubble = styled.div`
  position: absolute;
  bottom: 1px;
  right: 0;

  width: 14px !important;
  height: 14px !important;

  border-radius: 28px !important;
  border: 1px solid #ececec !important;
  background-image: linear-gradient(#54a3ff, #006eed);
`

const BadgeTextBox = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`

const BadgeText = styled.span`
  font-size: 12px;
  letter-spacing: -1px;
  color: white;
`

export const TextAreaCornerTag = ({
  target,
  onClick,
  children,
}: {
  target?: HTMLElement
  onClick: () => void
  children?: string
}) => {
  const box = document.createElement('mazed-textarea-augmentation')
  box.style.width = '0'
  box.style.height = '0'
  React.useEffect(() => {
    if (target) {
      const mount = target.parentElement
      mount?.insertBefore(box, target)
      return () => {
        mount?.removeChild(box)
      }
    }
    return () => {}
  })
  if (target == null) {
    return null
  }
  return ReactDOM.createPortal(
    <OuterBox
      css={{
        width: target?.clientWidth,
        height: target?.clientHeight,
      }}
    >
      <Box onClick={onClick}>
        <Logo />
        <BadgeBox>
          <BadgeBubble>
            <BadgeTextBox>
              <BadgeText>{children}</BadgeText>
            </BadgeTextBox>
          </BadgeBubble>
        </BadgeBox>
      </Box>
    </OuterBox>,
    box
  )
}
