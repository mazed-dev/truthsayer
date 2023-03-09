import styled from '@emotion/styled'
import { Spinner } from 'elementary'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'
import type { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import React from 'react'
import { Button } from 'react-bootstrap'

const Box = styled.div`
  margin: 6px;
`
const Comment = styled.div`
  font-weight: 500;
  margin: 0 0 12px 0;
`
const ButtonBox = styled.div``
export function OpenTabsImporter({
  archaeologistState,
  progress,
}: {
  archaeologistState: ArchaeologistState
  progress: BackgroundActionProgress
}) {
  switch (archaeologistState.state) {
    case 'loading':
    case 'not-installed': {
      return <Spinner.Ring />
    }
    case 'installed': {
      break
    }
  }

  const upload = () => {
    FromTruthsayer.sendMessage({
      type: 'UPLOAD_CURRENTLY_OPEN_TABS_REQUEST',
    })
  }
  const cancel = () => {
    FromTruthsayer.sendMessage({
      type: 'CANCEL_UPLOAD_OF_CURRENTLY_OPEN_TABS_REQUEST',
    })
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
    </Box>
  )
}
