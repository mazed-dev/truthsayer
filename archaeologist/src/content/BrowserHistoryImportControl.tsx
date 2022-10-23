import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'

import {
  truthsayer_archaeologist_communication,
  MdiCancel,
  MdiCloudUpload,
  MdiDelete,
  Spinner,
} from 'elementary'
import { FromContent, BrowserHistoryUploadProgress } from '../message/types'

import { log, toSentenceCase } from 'armoury'

const Box = styled.div`
  margin: 0;
  padding: 0;
`
const Title = styled.div``

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;

  &:hover {
    background-color: #d0d1d2;
  }
`
const CancelPic = styled(MdiCancel)`
  vertical-align: middle;
`
const CloudUploadPic = styled(MdiCloudUpload)`
  vertical-align: middle;
`
const DeletePic = styled(MdiDelete)`
  vertical-align: middle;
`

type UploadBrowserHistoryProps = React.PropsWithChildren<{
  progress: BrowserHistoryUploadProgress
}>

/**
 * Widget with buttons that allow user to control import of their local browser
 * history, expected to be rendered within @see ExternalImport
 *
 * Intuitively, one may expect it to be defined somewhere in truthsayer,
 * alongside @see ExternalImport however it is within archaeologist intentionally.
 * That's because at the time of this writing the process relies on browser APIs
 * (e.g. those that allow to read and index user's history) which are not exposed
 * to general web apps -- only web extensions have appropriate access, more
 * specifically - extension's 'background' script. This limits the number of
 * places where user-facing buttons to control the import process can live:
 *    - extension's 'popup' script
 *    - extension's 'content' script
 *
 * Older implementations of history import were in 'popup' which was straighforward
 * from a technical perspective, but inconsistent UX-wise with other kinds of
 * data imports which are all controlled from @see ExternalImport in truthsayer.
 * With 'popup' placement not good enough, desire to bring to users a consistent
 * import UX lead to the implementation below which places all control elements
 * in the only remaining place -- 'content' script.
 *
 * So from a user perspective this widget is just a bunch of buttons in
 * truthsayer, but it is implemented via a 'content' script augmentation that's
 * injected into truthsayer tabs via archaeologist.
 */
export function BrowserHistoryImportControl({
  progress,
}: UploadBrowserHistoryProps) {
  const [isBeingCancelled, setIsBeingCancelled] = React.useState(false)
  const [deletedNodesCount, setDeletedNodesCount] = React.useState(0)

  const startUpload = async () => {
    log.debug('startUpload')
    FromContent.sendMessage({
      type: 'UPLOAD_BROWSER_HISTORY',
    }).finally(() => {
      setIsBeingCancelled(false)
    })
  }
  const cancelUpload = () => {
    log.debug('cancelUpload')
    setIsBeingCancelled(true)
    FromContent.sendMessage({
      type: 'CANCEL_BROWSER_HISTORY_UPLOAD',
    })
  }
  const deletePreviouslyUploaded = () => {
    log.debug('deletePreviouslyUploaded')
    FromContent.sendMessage({
      type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY',
    }).then((response) => setDeletedNodesCount(response.numDeleted))
  }
  const inProgress = progress.processed !== progress.total || isBeingCancelled
  const browserName = toSentenceCase(process.env.BROWSER || 'browser')
  if (inProgress) {
    return (
      <Box>
        <Title>
          <Spinner.Ring /> Importng {browserName} history [{progress.processed}/
          {progress.total}]
        </Title>
        <Button onClick={cancelUpload} disabled={isBeingCancelled}>
          <CancelPic /> Cancel
        </Button>
      </Box>
    )
  } else {
    return (
      <Box>
        <Title>Import {browserName} history</Title>
        <Button onClick={startUpload}>
          <CloudUploadPic /> Import
        </Button>
        {deletedNodesCount > 0 ? (
          <span>[{deletedNodesCount}] deleted </span>
        ) : (
          <Button onClick={deletePreviouslyUploaded}>
            <DeletePic /> Delete imported
          </Button>
        )}
      </Box>
    )
  }
}

export function BrowserHistoryImportControlPortal({
  progress,
}: UploadBrowserHistoryProps) {
  const container = document.createElement(
    'mazed-archaeologist-browser-history-import-control'
  )
  /**
   * This is an effect to inject element container to the content DOM tree. There
   * are 2 reasons to use `useEffect` for it:
   *
   *   1. We need a clean up (see lambda as a return value of `useEffect`).
   *   Otherwise react would never delete rendered element.
   *   2. Container has to be deleted-and-added __on every render__, otherwise we
   *   would see only first version of the element without any further updates.
   *   There is no dependency list here on purpose, to re-inject container into
   *   the content DOM on every update.
   */
  React.useEffect(() => {
    const target = document.getElementById(
      truthsayer_archaeologist_communication.kTruthsayerBrowserHistoryImportWidgetId
    )
    target?.appendChild(container)
    return () => {
      target?.removeChild(container)
    }
  })
  return ReactDOM.createPortal(
    <div>
      <BrowserHistoryImportControl progress={progress} />
    </div>,
    container
  )
}
