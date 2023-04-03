import styled from '@emotion/styled'
import { Spinner } from 'elementary'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'
import type { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import React from 'react'
import { Button } from 'react-bootstrap'
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
  progress,
}: {
  archaeologistState: ArchaeologistState
  progress: BackgroundActionProgress
}) {
  const [error, setError] = React.useState<string | undefined>(undefined)

  switch (archaeologistState.state) {
    case 'loading':
    case 'not-installed': {
      return <Spinner.Ring />
    }
    case 'installed': {
      break
    }
  }

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

  return (
    <Box>
      <Comment>Add your current tabs to your Mazed memory:</Comment>
      <ButtonBox>
        {progress.processed === progress.total ? (
          <>
            <Button variant="primary" onClick={upload}>
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
