import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'
import { errorise, log } from 'armoury'

import Switch from 'react-switch'
import {
  AppSettings,
  FromTruthsayer,
} from 'truthsayer-archaeologist-communication'
import MzdGlobalContext from './lib/global'
import { ArchaeologistState } from './apps-list/archaeologistState'

const Box = styled(Container)`
  padding: 18px;
  height: 200px;
`

export function ApplicationSettings({
  className,
  archaeologistState,
}: {
  className?: string
  archaeologistState: ArchaeologistState
}) {
  const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null)
  useAsyncEffect(async () => {
    if (archaeologistState.state !== 'installed') {
      return
    }
    const response = await FromTruthsayer.sendMessage({
      type: 'GET_APP_SETTINGS_REQUEST',
    })
    setAppSettings(response.settings)
  }, [archaeologistState])

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
