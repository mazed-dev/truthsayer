import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import lodash from 'lodash'

import {
  truthsayer_archaeologist_communication,
  MdiCancel,
  MdiCloudUpload,
  MdiDelete,
  Spinner,
} from 'elementary'
import {
  FromContent,
  BrowserHistoryUploadProgress,
  BrowserHistoryUploadMode,
} from '../message/types'
import { mazed } from '../util/mazed'

import { toSentenceCase, unixtime } from 'armoury'

const Box = styled.div`
  margin: 0;
  padding: 0;
`
const Title = styled.div`
  margin-bottom: 10px;
`
const Message = styled.div`
  margin-bottom: 10px;
  font-style: italic;
`
const Comment = styled.span`
  font-style: italic;
  color: grey;
`
const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;
  margin-right: 10px;

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

type BrowserHistoryImportControlState =
  | {
      step: 'standby'
      deletedNodesCount: number
    }
  | {
      step: 'pre-start'
      chosenMode: BrowserHistoryUploadMode
    }
  | {
      step: 'in-progress'
      isBeingCancelled: boolean
    }

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
  modes,
}: UploadBrowserHistoryProps &
  truthsayer_archaeologist_communication.BrowserHistoryImport.Config) {
  const [state, setState] = React.useState<BrowserHistoryImportControlState>(
    progress.processed !== progress.total
      ? {
          step: 'in-progress',
          isBeingCancelled: false,
        }
      : {
          step: 'standby',
          deletedNodesCount: 0,
        }
  )

  const showPreStartMessage = (chosenMode: BrowserHistoryUploadMode) => {
    setState({ step: 'pre-start', chosenMode })
  }
  const startUpload = (mode: BrowserHistoryUploadMode) => {
    setState({ step: 'in-progress', isBeingCancelled: false })
    FromContent.sendMessage({
      type: 'UPLOAD_BROWSER_HISTORY',
      ...mode,
    })
  }
  const cancelUpload = () => {
    setState({ step: 'in-progress', isBeingCancelled: true })
    FromContent.sendMessage({
      type: 'CANCEL_BROWSER_HISTORY_UPLOAD',
    })
  }
  const deletePreviouslyUploaded = () => {
    FromContent.sendMessage({
      type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY',
    }).then((response) =>
      setState({ step: 'standby', deletedNodesCount: response.numDeleted })
    )
  }
  const browserName = toSentenceCase(process.env.BROWSER || 'browser')

  if (state.step === 'standby') {
    const resumableUploadBtn = (
      <Button onClick={() => showPreStartMessage({ mode: 'resumable' })}>
        <CloudUploadPic /> Full import
      </Button>
    )

    const now = new Date()
    const daysToUpload = 31
    const daysAgo = new Date(now)
    daysAgo.setDate(now.getDate() - daysToUpload)
    const untrackedUploadBtn = (
      <Button
        onClick={() =>
          showPreStartMessage({
            mode: 'untracked',
            unixtime: {
              start: unixtime.from(daysAgo),
              end: unixtime.from(now),
            },
          })
        }
      >
        <CloudUploadPic /> Quick import (last {daysToUpload} days)
      </Button>
    )
    return (
      <Box>
        <Title>Import {browserName} history</Title>
        {modes.indexOf('untracked') !== -1 ? untrackedUploadBtn : null}
        {modes.indexOf('resumable') !== -1 ? resumableUploadBtn : null}
        {state.deletedNodesCount > 0 ? (
          <span>[{state.deletedNodesCount}] deleted </span>
        ) : (
          <Button onClick={deletePreviouslyUploaded}>
            <DeletePic /> Delete imported
          </Button>
        )}
      </Box>
    )
  } else if (state.step === 'pre-start') {
    return (
      <Box>
        <Message>
          Mazed will be opening and closing pages from your {browserName}{' '}
          history to save them exactly as you saw them. All tabs opened by Mazed
          will be closed automatically.
        </Message>
        <Button onClick={() => startUpload(state.chosenMode)}>Continue</Button>
        <Button
          onClick={() => setState({ step: 'standby', deletedNodesCount: 0 })}
        >
          Cancel
        </Button>
      </Box>
    )
  } else if (state.step === 'in-progress') {
    return (
      <Box>
        <Title>
          <Spinner.Ring /> Importing {browserName} history [{progress.processed}
          /{progress.total}]
          <Comment>
            {' '}
            (background process &mdash; you can close this tab)
          </Comment>
        </Title>
        <Button onClick={cancelUpload} disabled={state.isBeingCancelled}>
          <CancelPic /> Cancel
        </Button>
      </Box>
    )
  }
  return null
}

export function BrowserHistoryImportControlPortalForMazed(
  props: UploadBrowserHistoryProps
) {
  const [config, setConfig] =
    React.useState<truthsayer_archaeologist_communication.BrowserHistoryImport.Config | null>(
      null
    )
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const [beacon, newConfig] =
      truthsayer_archaeologist_communication.BrowserHistoryImport.archaeologist.findBeacon(
        document
      )
    if (!lodash.isEqual(config, newConfig)) {
      setConfig(newConfig)
    }
    beacon?.appendChild(container)
    return () => {
      beacon?.removeChild(container)
    }
  })
  const widget = config ? (
    <BrowserHistoryImportControl
      modes={config.modes}
      progress={props.progress}
    />
  ) : null
  return ReactDOM.createPortal(<div>{widget}</div>, container)
}

export function BrowserHistoryImportControlPortal(
  props: UploadBrowserHistoryProps
) {
  if (!mazed.isMazed(document.URL)) {
    return null
  }
  return <BrowserHistoryImportControlPortalForMazed {...props} />
}
