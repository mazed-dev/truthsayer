import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'

import { kCardBorder, Spinner } from 'elementary'
import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'
import { errorise, log, sleep } from 'armoury'
import GoogleChromeLogo from './img/GoogleChromeLogo.svg'
import Switch from 'react-switch'
import {
  AppSettings,
  FromTruthsayer,
} from 'truthsayer-archaeologist-communication'

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

async function getArchaeologistVersionWait() {
  let version: truthsayer_archaeologist_communication.VersionStruct | null =
    null
  for (let step = 0; step < 5 && version == null; step++) {
    await sleep(500)
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

  const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null)
  useAsyncEffect(async () => {
    const response = await FromTruthsayer.sendMessage({
      type: 'GET_APP_SETTINGS_REQUEST',
    })
    setAppSettings(response.settings)
  }, [])

  const toggleStorageType = (checked: boolean) => {
    const newAppSettings: AppSettings = {
      storageType: checked ? 'browser_ext' : 'datacenter',
    }
    FromTruthsayer.sendMessage({
      type: 'SET_APP_SETTINGS_REQUEST',
      newValue: newAppSettings,
    })
      .catch((reason) => {
        log.error(
          `Failed to set app settings, error '${errorise(reason).message}'; ` +
            'current settings vs attempted new:' +
            `${JSON.stringify(appSettings)} vs ${JSON.stringify(
              newAppSettings
            )}`
        )
      })
      .then(() => {
        setAppSettings(newAppSettings)
      })
  }
  const storageTypeToggle =
    appSettings !== null ? (
      <div>
        Store data locally:
        <Switch
          onChange={toggleStorageType}
          checked={appSettings.storageType === 'browser_ext'}
        />
      </div>
    ) : (
      <div />
    )
  return (
    <Box className={className}>
      <AppItem href={kGoogleChromeStoreLink}>
        <Logo src={GoogleChromeLogo} />
        <Name>
          Mazed for Chrome{' '}
          <Comment>
            &mdash;{' '}
            {chromeStatus === 'loading' ? <Spinner.Ring /> : chromeStatus}
            {storageTypeToggle}
          </Comment>
        </Name>
      </AppItem>
    </Box>
  )
}
