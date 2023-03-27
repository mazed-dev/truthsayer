import styled from '@emotion/styled'
import { Spinner } from 'elementary'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'
import type { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import React from 'react'
import { Button } from 'react-bootstrap'
import { FromArchaeologistContent } from 'truthsayer-archaeologist-communication'
import { errorise } from 'armoury'

const Box = styled.div`
  margin: 6px;
`
const Comment = styled.div`
  font-weight: 500;
  margin: 0 0 12px 0;
`
const ButtonBox = styled.div``

const ErrorBox = styled.div`
  color: red;
`

export function OpenTabsImporter({
  archaeologistState,
  onFinish,
}: {
  archaeologistState: ArchaeologistState
  onFinish?: () => void
}) {
  const [progress, setOpenTabsProgress] =
    React.useState<BackgroundActionProgress>({
      processed: 0,
      total: 0,
    })
  const [isFinished, setFinished] = React.useState<boolean>(false)
  React.useEffect(() => {
    const listener = (event: MessageEvent) => {
      // Only accept messages sent from archaeologist's content script
      // eslint-disable-next-line eqeqeq
      if (event.source != window) {
        return
      }

      // Discard any events that are not part of truthsayer/archaeologist
      // business logic communication
      const request = event.data
      if (!FromArchaeologistContent.isRequest(request)) {
        return
      }

      switch (request.type) {
        case 'REPORT_BACKGROUND_OPERATION_PROGRESS': {
          if (request.operation === 'open-tabs-upload') {
            setOpenTabsProgress(request.newState)
            if (request.newState.processed === request.newState.total) {
              setFinished(true)
              onFinish?.()
            }
          }
        }
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  })
  const [error, setError] = React.useState<string | undefined>(undefined)
  const upload = async () => {
    setError(undefined)
    try {
      await FromTruthsayer.sendMessage({
        type: 'UPLOAD_CURRENTLY_OPEN_TABS_REQUEST',
      })
    } catch (err) {
      setError(`Upload failed: ${errorise(err).message}`)
    }
  }
  const cancel = async () => {
    setError(undefined)
    try {
      await FromTruthsayer.sendMessage({
        type: 'CANCEL_UPLOAD_OF_CURRENTLY_OPEN_TABS_REQUEST',
      })
    } catch (err) {
      setError(`Failed to cancel: ${errorise(err).message}`)
    }
  }
  switch (archaeologistState.state) {
    case 'loading':
    case 'not-installed': {
      return <Spinner.Ring />
    }
    case 'installed': {
      break
    }
  }
  return (
    <Box>
      <Comment>Add your current tabs to your Mazed memory:</Comment>
      <ButtonBox>
        {progress.processed === progress.total ? (
          <>
            <Button variant="primary" onClick={upload} disabled={isFinished}>
              Add my open tabs
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={cancel}>
              Cancel open tabs saving
            </Button>
            <Spinner.Ring />[{progress.processed}/{progress.total}]
          </>
        )}
      </ButtonBox>
      <ErrorBox>{error}</ErrorBox>
    </Box>
  )
}
