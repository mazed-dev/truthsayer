import styled from '@emotion/styled'
import { Spinner } from 'elementary'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'
import type { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import React from 'react'

const Comment = styled.div`
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

  return progress.processed === progress.total ? (
    <>
      <Button onClick={upload}>Import open tabs</Button>
    </>
  ) : (
    <>
      <Button onClick={cancel}>Cancel open tabs import</Button>
      <Spinner.Ring />[{progress.processed}/{progress.total}]
    </>
  )
}
