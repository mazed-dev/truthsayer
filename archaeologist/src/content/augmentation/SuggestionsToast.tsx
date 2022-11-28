/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { mazed } from '../../util/mazed'

import {
  MdiClose,
  TDoc,
  ImgButton,
  ShrinkCard,
  NodeCardReadOnly,
} from 'elementary'
import { TNode } from 'smuggler-api'

import { Toast } from './../toaster/Toaster'
import { LogoSmall, ButtonItem, RefItem } from './../style'

const ClosePic = styled(MdiClose)`
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
  height: 80vh;
  overflow: scroll;
`

const SuggestionButton = styled(ImgButton)`
  opacity: 0.32;
  font-size: 12px;
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
  padding: 0;
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
      {notification ?? children}
    </SuggestionButton>
  )
}

function CardInsertButton({
  node,
  onClose,
}: {
  node: TNode
  onClose: () => void
}) {
  let toInsert: string
  let copySubj: string
  if (node.isWebBookmark() && node.extattrs?.web != null) {
    const { web, title, author } = node.extattrs
    const authorStr = author ? `\nby ${author}` : ''
    toInsert = ` 🧵 ${title}${authorStr}\n🔗 ${web.url} `
    copySubj = 'Link'
  } else if (node.isWebQuote() && node.extattrs?.web_quote != null) {
    const { text, url } = node.extattrs.web_quote
    const { author } = node.extattrs
    const authorStr = author ? `\nby ${author}` : ''
    toInsert = ` 🧵 ${text}${authorStr}\n🔗 ${url} `
    copySubj = 'Quote'
  } else if (node.isImage()) {
    const url = node.getBlobSource()
    toInsert = ` 🧵 ${url} `
    copySubj = 'Image'
  } else {
    const doc = TDoc.fromNodeTextData(node.getText())
    toInsert = ` 🧵 ${doc.genPlainText()}\n🔗 ${node.getDirectLink()} `
    copySubj = 'Note'
  }
  return (
    <CopySuggestionButton
      onClick={() => {
        navigator.clipboard.writeText(toInsert)
        onClose()
      }}
    >
      Copy {copySubj}
    </CopySuggestionButton>
  )
}

const SuggestedFragment = ({
  node,
  onClose,
}: {
  node: TNode
  onClose: () => void
}) => {
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  return (
    <SuggestedFragmentBox>
      <ShrinkCard showMore={seeMore} height={'104px'}>
        <NodeCardReadOnly node={node} strippedRefs strippedActions />
      </ShrinkCard>
      <SuggestedFragmentTools>
        <CardInsertButton node={node} onClose={onClose} />
        <SuggestionButton href={node.getDirectLink()}>
          Open Mazed
        </SuggestionButton>
        <SuggestionButton onClick={() => setSeeMore((more) => !more)}>
          See {seeMore ? 'less' : 'more'}
        </SuggestionButton>
      </SuggestedFragmentTools>
    </SuggestedFragmentBox>
  )
}

const SearchPhrase = styled(RefItem)`
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 300px;
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
    return (
      <SuggestedFragment key={node.getNid()} node={node} onClose={onClose} />
    )
  })
  return (
    <Toast toastKey={'read-write-augmentation-toast'}>
      <ToastBox>
        <Header>
          <LogoSmall />
          <SearchPhrase href={mazed.makeSearchUrl(keyphrase).toString()}>
            &ldquo;{keyphrase}&rdquo;
          </SearchPhrase>
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
