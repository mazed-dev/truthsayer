/** @jsxImportSource @emotion/react */

import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import { LogoSmall, ButtonItem, RefItem } from './../style'

const ToastBox = styled.div`
  width: 368px;
  display: flex;
  flex-direction: column;

  margin: 4px !important;
  background: #ffffff !important;
  border: 1px solid #ececec !important;
  border-radius: 4px !important;
  color: black !important;
  box-shadow: 2px 2px 4px #8c8c8ceb;
`

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const SuggestionsToastSuggestionsBox = styled.div`
  display: flex;
  flex-direction: column;
`

export const TextAreaCornerTag = ({
  target,
}: {
  target?: Node
}) => {
  const box = document.createElement('mazed-textarea-augmentation')
  React.useEffect(() => {
    target?.appendChild(box)
    return () => {
      target?.removeChild(box)
    }
  })
  return ReactDOM.createPortal(<></>, box)
}
