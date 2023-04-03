import React from 'react'
import styled from '@emotion/styled'
import { Redirect } from 'react-router'
import { Button as ReactBootstrapButton } from 'react-bootstrap'

import { MdiCancel, MdiCloudUpload, MdiDelete, Spinner } from 'elementary'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import {
  BackgroundActionProgress,
  BrowserHistoryUploadMode,
  FromTruthsayer,
} from 'truthsayer-archaeologist-communication'
import { errorise, toSentenceCase } from 'armoury'
import { routes } from '../lib/route'
import { getBrowserName } from '../util/browser'
import moment from 'moment'

const Box = styled.div``
const Message = styled.div`
  margin: 0 0 8px 0;
`
const Comment = styled.div`
  font-style: italic;
  color: grey;
  margin: 0 0 8px 0;
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
const OnboardingButton = styled(ReactBootstrapButton)`
  margin-right: 10px;
`
const CancelPic = styled(MdiCancel)`
  vertical-align: middle;
`
const CloudUploadPic = styled(MdiCloudUpload)`
  vertical-align: middle;
  margin-right: 4px;
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

type UploadBrowserHistoryProps = React.PropsWithChildren<{
  progress: BackgroundActionProgress
  disabled?: boolean
}>

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
  | {
      step: 'finished'
    }

function BrowserHistoryImportControl({
  progress,
  disabled,
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
  React.useEffect(() => {
    if (progress.processed === progress.total && progress.processed > 0) {
      setState({ step: 'finished' })
    }
  }, [progress])
  const browserName = toSentenceCase(getBrowserName() ?? 'browser')

  if (state.step === 'standby') {
    return (
      <Box>
        <Title>Import {browserName} history</Title>
        <Button
          onClick={() => showPreStartMessage({ mode: 'resumable' })}
          disabled={disabled}
        >
          <CloudUploadPic /> Full import
        </Button>
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
  return (
    <Box>
      <Title>Import {browserName} history</Title>
      <span>🏁 Finished, {progress.total} pages saved</span>
    </Box>
  )
}

function BrowserHistoryImportControlForOnboarding({
  progress,
  disabled,
  onClick,
}: {
  onClick?: () => void
} & UploadBrowserHistoryProps) {
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
  React.useEffect(() => {
    if (progress.processed === progress.total && progress.processed > 0) {
      setState({ step: 'finished' })
    }
  }, [progress])
  const browserName = toSentenceCase(getBrowserName() ?? 'browser')

  if (state.step === 'standby') {
    return (
      <Box>
        <Comment>
          Mazed will be opening and closing pages from your {browserName}{' '}
          history to save them exactly as you saw them. All tabs opened by Mazed
          will be closed automatically.
        </Comment>
        <OnboardingButton
          onClick={() => {
            onClick?.()
            startUpload({
              mode: 'untracked',
              unixtime: {
                start: moment().subtract(31, 'days').unix(),
                end: moment().unix(),
              },
            })
          }}
          disabled={disabled}
        >
          <CloudUploadPic /> Import {browserName} history
        </OnboardingButton>
        <ErrorBox>{state.lastError}</ErrorBox>
      </Box>
    )
  } else if (state.step === 'in-progress') {
    return (
      <Box>
        <Title>
          Importing {browserName} history [{progress.processed}/{progress.total}
          ]<Comment> (background process &mdash; you can continue)</Comment>
        </Title>
      </Box>
    )
  }
  return (
    <Box>
      <Title>Import {browserName} history</Title>
      <span>🏁 Finished, {progress.total} pages saved</span>
    </Box>
  )
}

/**
 * Widget with buttons that allow user to control import of their local browser
 * history
 */
export function BrowserHistoryImporter({
  archaeologistState,
  progress,
  disabled,
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

  return <BrowserHistoryImportControl progress={progress} disabled={disabled} />
}

export function BrowserHistoryImporterForOnboarding({
  archaeologistState,
  progress,
  disabled,
  onClick,
}: {
  archaeologistState: ArchaeologistState
  onClick?: () => void
} & UploadBrowserHistoryProps) {
  switch (archaeologistState.state) {
    case 'not-installed': {
      return <Redirect to={routes.onboarding} />
    }
    case 'loading': {
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
  return (
    <BrowserHistoryImportControlForOnboarding
      progress={progress}
      disabled={disabled}
      onClick={onClick}
    />
  )
}
