/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { mazed } from '../../util/mazed'

import { TDoc, ShrinkMinimalCard, NodeCardReadOnly } from 'elementary'
import { TNode } from 'smuggler-api'

import { Toast, useOutsideToastClickHandler } from './../toaster/Toaster'
import { LogoSmall, RefItem } from './../style'
import { MeteredButton } from '../elements/MeteredButton'

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

const SearchPhrase = styled(RefItem)`
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 300px;
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

function getTextToInsert(node: TNode): string {
  let toInsert: string
  if (node.isWebBookmark() && node.extattrs?.web != null) {
    const { web, title, author } = node.extattrs
    const authorStr = author ? `\nby ${author}` : ''
    toInsert = `${title}${authorStr}\n🧵 ${web.url} `
  } else if (node.isWebQuote() && node.extattrs?.web_quote != null) {
    const { text, url } = node.extattrs.web_quote
    const { author } = node.extattrs
    const authorStr = author ? `\nby ${author}` : ''
    toInsert = `“${text}”${authorStr}\n🧵 ${url} `
  } else if (node.isImage()) {
    const url = node.getBlobSource()
    toInsert = ` 🧵 ${url} `
  } else {
    const doc = TDoc.fromNodeTextData(node.getText())
    toInsert = `${doc.genPlainText()}\n🧵 ${node.getDirectUrl()} `
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
  let copySubj: string
  if (node.isWebBookmark() && node.extattrs?.web != null) {
    copySubj = 'Link'
  } else if (node.isWebQuote() && node.extattrs?.web_quote != null) {
    copySubj = 'Quote'
  } else if (node.isImage()) {
    copySubj = 'Image'
  } else {
    copySubj = 'Note'
  }
  return (
    <CopySuggestionButton
      onClick={() => {
        const toInsert = getTextToInsert(node)
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
  return (
    <SuggestedCardBox>
      <ShrinkMinimalCard showMore={seeMore} height={'104px'}>
        <NodeCardReadOnly node={node} strippedRefs strippedActions />
      </ShrinkMinimalCard>
      <SuggestedCardTools>
        <CardInsertButton node={node} onClose={onClose} />
        <SuggestionButton
          href={node.getDirectUrl()}
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
  keyphrase,
  suggested,
  onClose,
}: {
  keyphrase: string
  suggested: TNode[]
  onClose: () => void
}) => {
  const suggestedEl = suggested.map((node: TNode) => {
    return <SuggestedCard key={node.getNid()} node={node} onClose={onClose} />
  })
  useOutsideToastClickHandler(onClose)
  return (
    <Toast toastKey={'read-write-augmentation-toast'}>
      <ToastBox>
        <Header>
          <LogoSmall />
          <SearchPhrase
            href={mazed.makeSearchUrl(keyphrase).toString()}
            target="_blank"
            rel="noreferrer noopener"
          >
            &ldquo;{keyphrase}&rdquo;
          </SearchPhrase>
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
