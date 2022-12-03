/** @jsxImportSource @emotion/react */

import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import LogoImage from '../../../public/logo-fade-48x48.png'
import { ContentContext } from '../context'

const OuterBox = styled.div`
  position: absolute;
  display: block;
  pointer-events: none;
`
const Box = styled.div`
  position: absolute;
  bottom: 2px;
  right: -8px;

  user-select: none;
  cursor: pointer;
  pointer-events: all;

  z-index: 1024;
`

const LogoBox = styled.img`
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
`
const Logo = ({ className }: { className?: string }) => (
  <LogoBox src={LogoImage} className={className} />
)

const BadgeBox = styled.div`
  position: static;
`

const BadgeBubble = styled.div`
  position: absolute;
  bottom: 1px;
  right: 0;

  width: 18px !important;
  height: 18px !important;

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
  letter-spacing: 0;
  color: white;
`

export const TextAreaCorner = ({
  target,
  onClick,
  suggestionsNumber,
}: {
  target?: HTMLTextAreaElement
  onClick: React.MouseEventHandler
  suggestionsNumber: number
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
  const ctx = React.useContext(ContentContext)
  const onMeteredClick = (event: React.MouseEvent) => {
    ctx.analytics?.capture('TextAreaCorner:Click', {
      text: suggestionsNumber.toString(),
      targetTagName: target?.tagName.toLowerCase(),
      targetElementType: target?.type,
      targetSelectionStart: target?.selectionStart,
      targetSelectionEnd: target?.selectionEnd,
    })
    onClick(event)
  }
  if (target == null) {
    return null
  }
  return ReactDOM.createPortal(
    <OuterBox
      css={{
        width: target?.clientWidth + 'px',
        height: target?.clientHeight + 'px',
      }}
    >
      <Box onClick={onMeteredClick}>
        <Logo />
        <BadgeBox>
          <BadgeBubble>
            <BadgeTextBox>
              <BadgeText>
                {suggestionsNumber > 0 ? suggestionsNumber.toString() : ''}
              </BadgeText>
            </BadgeTextBox>
          </BadgeBubble>
        </BadgeBox>
      </Box>
    </OuterBox>,
    box
  )
}