import styled from '@emotion/styled'
import { Spinner } from 'elementary'
import { useState, useContext } from 'react'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import MzdGlobalContext from '../lib/global'
import { TruthsayerLink } from '../lib/TrueLink'

const Box = styled.div``
const Message = styled.div``
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

type OpenTabsImporterState =
  | {
      state: 'ready'
    }
  | {
      state: 'in-progress'
      progress: Promise<void>
    }
  | {
      state: 'cancelling'
      progress: Promise<void>
    }

export function OpenTabsImporter({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}) {
  const [state, setState] = useState<OpenTabsImporterState | null>(
    initStateFrom(archaeologistState)
  )
  if (state == null) {
    return (
      <Comment>
        <Spinner.Ring />
      </Comment>
    )
  }

  switch (state.state) {
    case 'ready': {
      const upload = () => {
        const progress: Promise<void> = FromTruthsayer.sendMessage({
          type: 'UPLOAD_CURRENTLY_OPEN_TABS_REQUEST',
        })
          .then(() => {})
          .finally(() => setState({ state: 'ready' }))
        setState({ state: 'in-progress', progress })
      }
      return <Button onClick={upload}>Upload open tabs</Button>
    }
    case 'in-progress':
    case 'cancelling': {
      const cancel = () => {
        FromTruthsayer.sendMessage({
          type: 'CANCEL_UPLOAD_OF_CURRENTLY_OPEN_TABS_REQUEST',
        })
        setState({ state: 'cancelling', progress: state.progress })
      }
      return (
        <Button onClick={cancel} disabled={state.state === 'cancelling'}>
          {state.state !== 'cancelling' ? 'Cancel' : 'Cancelling...'}
        </Button>
      )
    }
  }
}

function initStateFrom(
  archaeologistState: ArchaeologistState
): OpenTabsImporterState | null {
  switch (archaeologistState.state) {
    case 'loading':
    case 'not-installed': {
      return null
    }
    case 'installed': {
      return { state: 'ready' }
    }
  }
}
