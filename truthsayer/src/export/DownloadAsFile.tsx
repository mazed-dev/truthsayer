/** @jsxImportSource @emotion/react */

import React, { useContext, useCallback, useState } from 'react'
import styled from '@emotion/styled'
import FileSaver from 'file-saver'
import moment from 'moment'

import { MzdGlobalContext } from '../lib/global'

import { MdiDownload, Spinner, TDoc, truthsayer } from 'elementary'
import { slateToMarkdown } from 'librarius'
import { MimeType } from 'armoury'
import { NodeUtil, TNodeJson, Nid } from 'smuggler-api'

const Box = styled.div``
const Label = styled.div`
  margin: 0 1em 1em 1em;
`
const BoxButtons = styled.div``

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;

  margin: 0 12px 0 12px;

  vertical-align: middle;
  &:hover {
    background-color: #d0d1d2;
  }
`

const DownloadIcon = styled(MdiDownload)`
  font-size: inherit;
  vertical-align: middle;
`

function createFileName(email: string, extension: string): string {
  return `MazedMemoryDump-${email}-${moment().valueOf()}.${extension}`
}

export function DownloadAsFile({ className }: { className?: string }) {
  const ctx = useContext(MzdGlobalContext)
  const [processingStatus, setProcessingStatus] = useState<boolean>(false)
  const saveAsPlainText = useCallback(async () => {
    setProcessingStatus(true)
    const iter = ctx.storage.node.iterate()
    const chunks: string[] = []
    while (true) {
      const node = await iter.next()
      if (node == null) {
        break
      }
      chunks.push(truthsayer.url.makeNode(node.nid).toString(), '\n\n')
      chunks.push('Created ', node.created_at.toString(), '\n')
      chunks.push('Last modified ', node.updated_at.toString(), '\n')
      if (NodeUtil.isImage(node)) {
        chunks.push('Image\n')
      } else if (NodeUtil.isWebBookmark(node) && node.extattrs != null) {
        const { web, /* preview_image ,*/ title, description, author } =
          node.extattrs
        const url = web?.url
        if (title != null) {
          chunks.push(title, '\n')
        }
        if (author != null) {
          chunks.push('By ', author, '\n')
        }
        if (url != null) {
          chunks.push('[Source](', url, ')\n\n')
        }
        if (description != null) {
          chunks.push('> ', description, '\n\n')
        }
        // Do we really need preview image?
        // if (preview_image != null) {
        //   chunks.push('[!preview](', preview_image.data, ')\n\n')
        // }
      } else if (NodeUtil.isWebQuote(node) && node.extattrs != null) {
        const { web_quote, author } = node.extattrs
        if (web_quote != null) {
          const { text, url } = web_quote
          if (author != null) {
            chunks.push('By ', author, ')\n')
          }
          if (text != null) {
            chunks.push('> ', text, '\n\n')
          }
          if (url != null) {
            chunks.push('[Source](', url, ')\n\n')
          }
        }
      }
      const doc = TDoc.fromNodeTextData(node.text)
      chunks.push(slateToMarkdown(doc.slate), '\n\n')
    }
    const blob = new Blob(chunks, { type: MimeType.TEXT_PLAIN_UTF_8 })
    FileSaver.saveAs(
      blob,
      createFileName(ctx.account?.getEmail() ?? 'noname', 'txt')
    )
    setProcessingStatus(false)
  }, [ctx.account, ctx.storage.node])
  const saveAsJson = useCallback(async () => {
    setProcessingStatus(true)
    const iter = ctx.storage.node.iterate()
    const chunks: Record<Nid, TNodeJson> = {}
    while (true) {
      const node = await iter.next()
      if (node == null) {
        break
      }
      chunks[node.nid] = NodeUtil.toJson(node)
    }
    const blob = new Blob([JSON.stringify(chunks)], { type: MimeType.JSON })
    FileSaver.saveAs(
      blob,
      createFileName(ctx.account?.getEmail() ?? 'noname', 'json')
    )
    setProcessingStatus(false)
  }, [ctx.account, ctx.storage.node])
  return (
    <Box className={className}>
      <Label>Download your memory</Label>
      <BoxButtons>
        <Button onClick={saveAsPlainText} disabled={processingStatus}>
          {processingStatus ? <Spinner.Ring /> : <DownloadIcon />} As plain text
        </Button>
        <Button onClick={saveAsJson} disabled={processingStatus}>
          {processingStatus ? <Spinner.Ring /> : <DownloadIcon />} As JSON
        </Button>
      </BoxButtons>
    </Box>
  )
}
