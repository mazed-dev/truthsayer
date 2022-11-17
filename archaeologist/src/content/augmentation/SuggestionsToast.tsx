import React from 'react'
import styled from '@emotion/styled'

import { MdiClose } from 'elementary'
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

export const SuggestionsToast = ({
  keyphrase,
  suggested,
  onClose,
}: {
  keyphrase: string
  suggested: TNode[]
  onClose: () => void
}) => {
  const suggestedEl = suggested.map((node: TNode) => {
    return <RefItem key={node.getNid()}>{node.getNid()}</RefItem>
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
