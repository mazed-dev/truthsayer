import React from 'react'
import styled from '@emotion/styled'

import { MdiCancel, MdiCloudUpload, MdiDelete, Spinner } from 'elementary'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import {
  BackgroundActionProgress,
  BrowserHistoryUploadMode,
  FromTruthsayer,
} from 'truthsayer-archaeologist-communication'
import { errorise, toSentenceCase, unixtime } from 'armoury'

const Box = styled.div``
const Message = styled.div``
const Comment = styled.div`
  font-style: italic;
  color: grey;
`

const Title = styled.div`
  margin-bottom: 10px;
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

const ErrorBox = styled.div`
  color: red;
`

export type BrowserHistoryImportConfig = {
  /** @see BrowserHistoryUploadMode for more info on what each mode means */
  modes: ('untracked' | 'resumable')[]
}

type UploadBrowserHistoryProps = React.PropsWithChildren<
  {
    progress: BackgroundActionProgress
  } & BrowserHistoryImportConfig
>

type BrowserHistoryImportControlState =
  | {
      step: 'standby'
      deletedNodesCount: number
      lastError?: string
    }
  | {
      step: 'pre-start'
      chosenMode: BrowserHistoryUploadMode
    }
  | {
      step: 'in-progress'
      isBeingCancelled: boolean
    }

function BrowserHistoryImportControl({
  progress,
  modes,
}: UploadBrowserHistoryProps) {
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
  const startUpload = async (mode: BrowserHistoryUploadMode) => {
    setState({ step: 'in-progress', isBeingCancelled: false })
    try {
      await FromTruthsayer.sendMessage({
        type: 'UPLOAD_BROWSER_HISTORY',
        ...mode,
      })
    } catch (err) {
      setState({
        step: 'standby',
        deletedNodesCount: 0,
        lastError: `Upload failed: "${errorise(err).message}"`,
      })
    }
  }
  const cancelUpload = async () => {
    setState({ step: 'in-progress', isBeingCancelled: true })
    await FromTruthsayer.sendMessage({
      type: 'CANCEL_BROWSER_HISTORY_UPLOAD',
    })
    setState({ step: 'standby', deletedNodesCount: 0 })
  }
  const deletePreviouslyUploaded = async () => {
    try {
      const response = await FromTruthsayer.sendMessage({
        type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY',
      })
      setState({ step: 'standby', deletedNodesCount: response.numDeleted })
    } catch (err) {
      setState({
        step: 'standby',
        deletedNodesCount: 0,
        lastError: `Deletion failed: "${errorise(err).message}"`,
      })
    }
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
        <ErrorBox>{state.lastError}</ErrorBox>
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

/**
 * Widget with buttons that allow user to control import of their local browser
 * history
 */
export function BrowserHistoryImporter({
  archaeologistState,
  progress,
  modes,
}: {
  archaeologistState: ArchaeologistState
} & UploadBrowserHistoryProps) {
  switch (archaeologistState.state) {
    case 'loading':
    case 'not-installed': {
      return (
        <Comment>
          <Spinner.Ring />
        </Comment>
      )
    }
    case 'installed': {
      break
    }
  }

  return <BrowserHistoryImportControl progress={progress} modes={modes} />
}
