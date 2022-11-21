/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
// import useIsMounted from 'ismounted'

import {
  MdiClose,
  MdiContentCopy,
  MdiLaunch,
  NodeStrip,
  TDoc,
  ImgButton,
} from 'elementary'
import { TNode } from 'smuggler-api'

import { Toast } from './../toaster/Toaster'
import { LogoSmall, ButtonItem, RefItem } from './../style'

const ClosePic = styled(MdiClose)`
  vertical-align: middle;
`
const CopyPic = styled(MdiContentCopy)`
  font-size: 16px;
  margin: 0 4px 0 0;
  vertical-align: middle;
`
const OpenPic = styled(MdiLaunch)`
  font-size: 16px;
  margin: 0 4px 0 0;
  vertical-align: middle;
`

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

function genSnippetToInsert(node: TNode): string {
  if (node.isWebBookmark()) {
    if (node.extattrs?.web != null) {
      const { web, title, author, description } = node.extattrs
      const authorStr = author ? ` by ${author}` : ''
      const descriptionStr = description ? ` — ${description}` : ''
      return ` 🧵 ${title}${authorStr}${descriptionStr} 🔗 ${web.url} `
    }
  } else if (node.isWebQuote()) {
    if (node.extattrs?.web_quote != null) {
      const { text, url } = node.extattrs.web_quote
      const { author } = node.extattrs
      const authorStr = author ? ` by ${author}` : ''
      return ` 🧵 ${text}${authorStr} 🔗 ${url} `
    }
  }
  const doc = TDoc.fromNodeTextData(node.getText())
  const title = doc.genTitle(280)
  return ` ${title} 🧵 ${node.getDirectLink()} `
}

const SuggestionButton = styled(ImgButton)`
  opacity: 0.12;
`

const SuggestedFragmentBox = styled.div`
  font-size: 12px;

  margin: 1px 4px 1px 4px;

  border: 1px solid #ececec;
  border-radius: 6px;
`
const SuggestedFragmentTools = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  border-top: 1px solid #ececec;
`
const CopySuggestionButton = ({
  children,
  onClick,
}: React.PropsWithChildren<{
  onClick: () => void
}>) => {
  const [notification, setNotification] = React.useState<string | null>(null)
  return (
    <SuggestionButton
      onClick={() => {
        if (notification != null) {
          setNotification(null)
        } else {
          onClick()
          setNotification('Copied!')
        }
      }}
    >
      {notification == null ? <CopyPic /> : null}
      {notification ?? children}
    </SuggestionButton>
  )
}

const SuggestedFragment = ({ node }: { node: TNode }) => {
  return (
    <SuggestedFragmentBox>
      <NodeStrip node={node} />
      <SuggestedFragmentTools>
        <CopySuggestionButton
          onClick={() =>
            navigator.clipboard.writeText(genSnippetToInsert(node))
          }
        >
          Link
        </CopySuggestionButton>
        <SuggestionButton href={node.getDirectLink()}>
          <OpenPic />
          In Mazed
        </SuggestionButton>
      </SuggestedFragmentTools>
    </SuggestedFragmentBox>
  )
}

export const SuggestionsToast = ({
  keyphrase,
  suggested,
  onClose,
  onPaste,
}: {
  keyphrase: string
  suggested: TNode[]
  onClose: () => void
  onPaste: () => void
}) => {
  const suggestedEl = suggested.map((node: TNode) => {
    return <SuggestedFragment key={node.getNid()} node={node} />
  })
  return (
    <Toast toastKey={'read-write-augmentation-toast'}>
      <ToastBox>
        <Header>
          <LogoSmall />
          <RefItem>In your Mazed 🐇 &ldquo;{keyphrase}&rdquo;</RefItem>
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
