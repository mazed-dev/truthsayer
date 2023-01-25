/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import {
  TDoc,
  ShrinkMinimalCard,
  NodeCardReadOnly,
  truthsayer,
} from 'elementary'
import { NodeUtil, StorageApi } from 'smuggler-api'
import type { TNode } from 'smuggler-api'

import { Toast, useOutsideToastClickHandler } from './../toaster/Toaster'
import { LogoSmall } from './../style'
import { MeteredButton } from '../elements/MeteredButton'
import { ContentContext } from '../context'

const ToastBox = styled.div`
  width: 368px;
  display: flex;
  flex-direction: column;

  margin: 4px;
  background: #ffffff;
  border: 1px solid #ececec;
  border-radius: 4px;
  color: black;
  box-shadow: 2px 2px 4px #8c8c8ceb;
`

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`
const HeaderText = styled.div`
  vertical-align: middle;
  font-size: 14px;
  font-style: italic;
  padding: 4px;
  color: #7a7a7a;
`

const SuggestionsToastSuggestionsBox = styled.div`
  display: flex;
  flex-direction: column;
  height: 80vh;
  overflow: scroll;
`

const SuggestionButton = styled(MeteredButton)`
  opacity: 0.32;
  font-size: 12px;
`

const SuggestedCardBox = styled.div`
  font-size: 12px;

  margin: 1px 4px 1px 4px;

  border: 1px solid #ececec;
  border-radius: 6px;
`

const SuggestedCardTools = styled.div`
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
      metricLabel={'Suggested Fragment Copy'}
    >
      {notification ?? children}
    </SuggestionButton>
  )
}

function getTextToInsert(storage: StorageApi, node: TNode): string {
  let toInsert: string
  if (NodeUtil.isWebBookmark(node) && node.extattrs?.web != null) {
    const { web, title, author } = node.extattrs
    const authorStr = author ? `, by ${author}` : ''
    toInsert = `${title}${authorStr}: 🧵 ${web.url} `
  } else if (NodeUtil.isWebQuote(node) && node.extattrs?.web_quote != null) {
    const { text, url } = node.extattrs.web_quote
    const { author } = node.extattrs
    const authorStr = author ? `, by ${author}` : ''
    toInsert = `“${text}”${authorStr}: 🧵 ${url} `
  } else if (NodeUtil.isImage(node)) {
    const url = storage.blob.sourceUrl(node.nid)
    toInsert = ` 🧵 ${url} `
  } else {
    const doc = TDoc.fromNodeTextData(node.text)
    toInsert = `${doc.genPlainText()}: 🧵 ${storage.node.url(node.nid)} `
  }
  return toInsert
}

function CardInsertButton({
  node,
  onClose,
}: {
  node: TNode
  onClose: () => void
}) {
  const ctx = React.useContext(ContentContext)
  let copySubj: string
  if (NodeUtil.isWebBookmark(node) && node.extattrs?.web != null) {
    copySubj = 'Link'
  } else if (NodeUtil.isWebQuote(node) && node.extattrs?.web_quote != null) {
    copySubj = 'Quote'
  } else if (NodeUtil.isImage(node)) {
    copySubj = 'Image'
  } else {
    copySubj = 'Note'
  }
  return (
    <CopySuggestionButton
      onClick={() => {
        const toInsert = getTextToInsert(ctx.storage, node)
        navigator.clipboard.writeText(toInsert)
        onClose()
      }}
    >
      Copy {copySubj}
    </CopySuggestionButton>
  )
}

const SuggestedCard = ({
  node,
  onClose,
}: {
  node: TNode
  onClose: () => void
}) => {
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  const ctx = React.useContext(ContentContext)
  return (
    <SuggestedCardBox>
      <ShrinkMinimalCard showMore={seeMore} height={'104px'}>
        <NodeCardReadOnly
          node={node}
          strippedRefs
          strippedActions
          storage={ctx.storage}
        />
      </ShrinkMinimalCard>
      <SuggestedCardTools>
        <CardInsertButton node={node} onClose={onClose} />
        <SuggestionButton
          href={truthsayer.url.makeNode(node.nid).toString()}
          metricLabel={'Suggested Fragment Open in Mazed'}
        >
          Open Mazed
        </SuggestionButton>
        <SuggestionButton
          onClick={() => setSeeMore((more) => !more)}
          metricLabel={'Suggested Fragment See ' + (seeMore ? 'less' : 'more')}
        >
          See {seeMore ? 'less' : 'more'}
        </SuggestionButton>
      </SuggestedCardTools>
    </SuggestedCardBox>
  )
}

export const SuggestionsToast = ({
  suggested,
  onClose,
}: {
  suggested: TNode[]
  onClose: () => void
}) => {
  const suggestedEl = suggested.map((node: TNode) => {
    return <SuggestedCard key={node.nid} node={node} onClose={onClose} />
  })
  useOutsideToastClickHandler(onClose)
  return (
    <Toast toastKey={'read-write-augmentation-toast'}>
      <ToastBox>
        <Header>
          <LogoSmall />
          <HeaderText>Found {suggested.length} fragments</HeaderText>
          <MeteredButton
            onClick={onClose}
            metricLabel={'Suggestions Toast Close'}
          >
            Close
          </MeteredButton>
        </Header>
        <SuggestionsToastSuggestionsBox>
          {suggestedEl}
        </SuggestionsToastSuggestionsBox>
      </ToastBox>
    </Toast>
  )
}
