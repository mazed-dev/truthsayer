import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'

import { kCardBorder, Spinner } from 'elementary'
import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'
import { sleep } from 'armoury'
import GoogleChromeLogo from './img/GoogleChromeLogo.svg'

type MazedAppLinks =
  | 'https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc'

const kGoogleChromeStoreLink: MazedAppLinks =
  'https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc'

const Name = styled.div`
  font-size: 16px;
  margin: 10px;
`
const Comment = styled.span`
  font-style: italic;
  color: grey;
  margin-left: 1em;
`
const Box = styled(Container)`
  padding: 18px;
  height: 200px;
`

const AppItem = styled.a`
  display: flex;
  justify-content: left;
  align-items: center;
  color: inherit;
  text-decoration: none;

  border-radius: 8px;
  ${kCardBorder};
  margin: 0 0 8px 0;
  padding: 10px;
`

const Logo = styled.img`
  width: 52px;
  height: 52px;
`

export async function getArchaeologistVersionWait() {
  let version: truthsayer_archaeologist_communication.VersionStruct | null =
    null
  for (let step = 0; step < 12 && version == null; step++) {
    await sleep(200)
    version =
      truthsayer_archaeologist_communication.truthsayer.getArchaeologistVersion(
        window.document
      )
  }
  return version
}

export function AppsList({ className }: { className?: string }) {
  const [chromeStatus, setChromeStatus] = React.useState<
    'loading' | 'Installed' | 'Not installed'
  >('loading')
  useAsyncEffect(async () => {
    const version = await getArchaeologistVersionWait()
    setChromeStatus(version == null ? 'Not installed' : 'Installed')
  })

  return (
    <Box className={className}>
      <AppItem href={kGoogleChromeStoreLink}>
        <Logo src={GoogleChromeLogo} />
        <Name>
          Mazed for Chrome{' '}
          <Comment>
            &mdash;{' '}
            {chromeStatus === 'loading' ? <Spinner.Ring /> : chromeStatus}
          </Comment>
        </Name>
      </AppItem>
    </Box>
  )
}
