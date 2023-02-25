import styled from '@emotion/styled'
import { Spinner } from 'elementary'
import { useContext } from 'react'
import { StorageApi } from 'smuggler-api'
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

export function OpenTabsImporter({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}) {
  const ctx = useContext(MzdGlobalContext)

  return <Box>{describe(ctx.storage, archaeologistState)}</Box>
}

function describe(storage: StorageApi, state: ArchaeologistState) {
  switch (state.state) {
    case 'loading': {
      return (
        <Comment>
          <Spinner.Ring /> Checking browser extension
        </Comment>
      )
    }
    case 'installed': {
      const upload = () =>
        FromTruthsayer.sendMessage({
          type: 'UPLOAD_CURRENTLY_OPEN_TABS_REQUEST',
        })
      return <Button onClick={upload}>Upload open tabs</Button>
    }
    case 'not-installed': {
      return (
        <Message>
          Mazed browser extension is not found, go to{' '}
          <TruthsayerLink to={'/apps-to-install'}>Mazed Apps</TruthsayerLink> to
          install Mazed for your browser.
        </Message>
      )
    }
  }
}
