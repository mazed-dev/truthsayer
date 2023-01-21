import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'
import { errorise, log, sleep } from 'armoury'
import browser from 'webextension-polyfill'

import Switch from 'react-switch'
import {
  AppSettings,
  FromTruthsayer,
  VersionStruct,
} from 'truthsayer-archaeologist-communication'
import MzdGlobalContext from './lib/global'

const Box = styled(Container)`
  padding: 18px;
  height: 200px;
`

async function waitForArchaeologistToLoad(): Promise<VersionStruct> {
  const maxAttempts = 5
  let error = ''
  for (let attempt = 0; attempt < maxAttempts; ++attempt) {
    try {
      const response = await FromTruthsayer.sendMessage({
        type: 'GET_ARCHAEOLOGIST_STATE_REQUEST',
      })
      return response.version
    } catch (reason) {
      if (attempt === maxAttempts - 1) {
        error = errorise(reason).message
      }
    }
  }
  throw new Error(
    `Failed to get archaeologist state after ${maxAttempts} attempts. ` +
      `Last error: ${error}`
  )
}

export function ApplicationSettings({ className }: { className?: string }) {
  const [archaeologistStatus, setArchaeologistStatus] = React.useState<
    'loading' | 'Installed' | 'Not installed'
  >('loading')

  React.useEffect(() => {
    waitForArchaeologistToLoad()
      .then((_version: VersionStruct) => setArchaeologistStatus('Installed'))
      .catch((reason) => {
        setArchaeologistStatus('Not installed')
        log.error(errorise(reason).message)
      })
  }, [])

  const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null)
  useAsyncEffect(async () => {
    if (archaeologistStatus !== 'Installed') {
      return
    }
    const response = await FromTruthsayer.sendMessage({
      type: 'GET_APP_SETTINGS_REQUEST',
    })
    setAppSettings(response.settings)
  }, [archaeologistStatus])

  const toggleStorageType = async (checked: boolean) => {
    const newAppSettings: AppSettings = {
      storageType: checked ? 'browser_ext' : 'datacenter',
    }
    try {
      await FromTruthsayer.sendMessage({
        type: 'SET_APP_SETTINGS_REQUEST',
        newValue: newAppSettings,
      })
      setAppSettings(newAppSettings)
    } catch (reason) {
      log.error(
        `Failed to set app settings, error '${errorise(reason).message}'; ` +
          'current settings vs attempted new:' +
          `${JSON.stringify(appSettings)} vs ${JSON.stringify(newAppSettings)}`
      )
    }
  }
  const ctx = React.useContext(MzdGlobalContext)
  const [storageToggleIsEnabled] = React.useState<boolean>(
    (process.env.NODE_ENV === 'development' ||
      ctx.analytics?.isFeatureEnabled('local-storage-toggle')) ??
      false
  )
  const storageTypeToggle =
    appSettings !== null ? (
      <div>
        Store data locally:
        <Switch
          disabled={!storageToggleIsEnabled}
          onChange={toggleStorageType}
          checked={appSettings.storageType === 'browser_ext'}
        />
      </div>
    ) : (
      <div />
    )

  return <Box className={className}>{storageTypeToggle}</Box>
}
