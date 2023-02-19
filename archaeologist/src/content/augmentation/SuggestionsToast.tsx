/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import {
  TDoc,
  ShrinkMinimalCard,
  NodeCardReadOnly,
  truthsayer,
  HoverTooltip,
  Spinner,
} from 'elementary'
import { NodeUtil, StorageApi } from 'smuggler-api'
import type { TNode } from 'smuggler-api'

import { Toast, useOutsideToastClickHandler } from './../toaster/Toaster'
import { LogoSmall } from './../style'
import { MeteredButton } from '../elements/MeteredButton'
import { ContentContext } from '../context'
import {
  Close,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  OpenInNew,
} from '@emotion-icons/material'

const ToastBox = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;

  margin: 4px;
  background: #ffffff;
  border-radius: 4px;
  color: black;
  box-shadow: 2px 2px 4px #8c8c8ceb;
`

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-bottom: 1px solid #ececec;
`
const HeaderText = styled.div`
  color: #7a7a7a;
  font-size: 14px;
  font-style: italic;
  padding: 4px;
  vertical-align: middle;
`

const SuggestionsToastSuggestionsBox = styled.div`
  display: flex;
  flex-direction: column;
  height: 80vh;
  overflow-y: scroll;
`

const SuggestionButton = styled(MeteredButton)`
  opacity: 0.32;
  font-size: 12px;
  padding: 0.4em 0.5em 0.4em 0.5em;
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
  tooltip,
}: React.PropsWithChildren<{
  onClick: () => void
  tooltip: string
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
      <HoverTooltip tooltip={tooltip} placement="bottom">
        {notification ?? children}
      </HoverTooltip>
    </SuggestionButton>
  )
}

function getTextToInsert(storage: StorageApi, node: TNode): string {
  let toInsert: string
  if (NodeUtil.isWebBookmark(node) && node.extattrs?.web != null) {
    toInsert = node.extattrs.web.url
  } else if (NodeUtil.isWebQuote(node) && node.extattrs?.web_quote != null) {
    const { text, url } = node.extattrs.web_quote
    const { author } = node.extattrs
    const authorStr = author ? `, by ${author}` : ''
    toInsert = `“${text}”${authorStr} ${url} `
  } else if (NodeUtil.isImage(node)) {
    toInsert = storage.blob.sourceUrl(node.nid)
  } else {
    const doc = TDoc.fromNodeTextData(node.text)
    toInsert = doc.genPlainText()
  }
  return toInsert
}

function CardCopyButton({
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
      tooltip={`Copy ${copySubj}`}
    >
      <ContentCopy size="14px" />
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
      <ShrinkMinimalCard showMore={seeMore} height={'128px'}>
        <NodeCardReadOnly
          node={node}
          strippedRefs
          strippedActions
          storage={ctx.storage}
        />
      </ShrinkMinimalCard>
      <SuggestedCardTools>
        <CardCopyButton node={node} onClose={onClose} />
        <SuggestionButton
          href={truthsayer.url.makeNode(node.nid).toString()}
          metricLabel={'Suggested Fragment Open in Mazed'}
        >
          <HoverTooltip tooltip={'Open in Mazed'} placement="bottom">
            <OpenInNew size="14px" />
          </HoverTooltip>
        </SuggestionButton>
        <SuggestionButton
          onClick={() => setSeeMore((more) => !more)}
          metricLabel={'Suggested Fragment See ' + (seeMore ? 'less' : 'more')}
        >
          <HoverTooltip
            tooltip={seeMore ? 'See less' : 'See more'}
            placement="bottom"
          >
            {seeMore ? <ExpandLess size="14px" /> : <ExpandMore size="14px" />}
          </HoverTooltip>
        </SuggestionButton>
      </SuggestedCardTools>
    </SuggestedCardBox>
  )
}

export const SuggestionsToast = ({
  suggested,
  onClose,
  isLoading,
}: {
  suggested: TNode[]
  onClose: () => void
  isLoading: boolean
}) => {
  const suggestedCards = suggested.map((node: TNode) => {
    return <SuggestedCard key={node.nid} node={node} onClose={onClose} />
  })
  useOutsideToastClickHandler(onClose)
  return (
    <Toast toastKey={'read-write-augmentation-toast'}>
      <ToastBox>
        <Header>
          <LogoSmall />
          {isLoading ? <Spinner.Ring /> : null}
          <HeaderText>({suggested.length})</HeaderText>
          <MeteredButton
            onClick={onClose}
            metricLabel={'Suggestions Toast Close'}
            css={{ marginRight: '2px', marginTop: '2px' }}
          >
            <HoverTooltip tooltip={'Open in Mazed'} placement="bottom">
              <Close size="16px" />
            </HoverTooltip>
          </MeteredButton>
        </Header>
        <SuggestionsToastSuggestionsBox>
          {suggestedCards}
        </SuggestionsToastSuggestionsBox>
      </ToastBox>
    </Toast>
  )
}
