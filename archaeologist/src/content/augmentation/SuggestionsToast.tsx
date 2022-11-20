/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { MdiClose, NodeStrip } from 'elementary'
import { TNode } from 'smuggler-api'

import { Toast } from './../toaster/Toaster'
import { LogoSmall, ButtonItem, RefItem } from './../style'

const ClosePic = styled(MdiClose)`
  vertical-align: middle;
`

const ToastBox = styled.div`
  display: flex;
  flex-direction: column;

  display: flex !important;
  width: max-content !important;
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

const SuggestedFragment = ({
  node,
  onInsert,
}: {
  node: TNode
  onInsert: (text: string) => void
}) => {
  return (
    <NodeStrip
      css={css`
        font-size: 12px;
      `}
      onClick={() => {
        onInsert('insertText Some test to be inserted')
      }}
      node={node}
    />
  )
}

export const SuggestionsToast = ({
  keyphrase,
  suggested,
  onClose,
  onInsert,
}: {
  keyphrase: string
  suggested: TNode[]
  onClose: () => void
  onInsert: (text: string) => void
}) => {
  const suggestedEl = suggested.map((node: TNode) => {
    return (
      <SuggestedFragment key={node.getNid()} node={node} onInsert={onInsert} />
    )
  })
  return (
    <Toast toastKey={'read-write-augmentation-toast'}>
      <ToastBox>
        <Header>
          <LogoSmall />
          <RefItem>Read/write augmentation 🐇 {keyphrase}</RefItem>
          <ButtonItem onClick={onClose}>
            <ClosePic />
          </ButtonItem>
        </Header>
        <SuggestionsToastSuggestionsBox>
          {suggestedEl}
        </SuggestionsToastSuggestionsBox>
      </ToastBox>
    </Toast>
  )
}
