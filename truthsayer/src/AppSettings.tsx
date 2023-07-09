import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'
import { errorise, log } from 'armoury'

import Switch from 'react-switch'
import {
  AppSettings,
  FromTruthsayer,
  defaultSettings,
} from 'truthsayer-archaeologist-communication'
import MzdGlobalContext from './lib/global'
import { ArchaeologistState } from './apps-list/archaeologistState'

const Box = styled(Container)`
  margin: 124px auto 12px auto;
  height: 200px;
  font-family: -apple-system, 'system-ui', 'Segoe UI', 'Noto Sans', Helvetica,
    Arial;
`

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 400;
  order: 0;
  margin-bottom: 24px;
  cursor: default;
`
const Section = styled.div`
  margin-bottom: 12px;
`
const SectionLabel = styled.h2`
  font-size: 16px;
  font-weight: 600;
  cursor: default;
`
const FeatureRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: flex-end;
  justify-content: flex-start;
  align-items: center;

  max-width: 360px;
  padding: 10px 14px 10px 14px;
  border-radius: 14px;
  &:hover {
    background-color: #e9ecef;
  }
`
const FeatureLabel = styled.div`
  font-size: 16px;
  cursor: default;
  margin-left: 16px;
`

export function ApplicationSettings({
  className,
  archaeologistState,
  isLikelyAuthorised,
}: {
  className?: string
  archaeologistState: ArchaeologistState
  isLikelyAuthorised: boolean
}) {
  const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null)
  useAsyncEffect(async () => {
    if (archaeologistState.state !== 'installed') {
      return
    }
    const response = await FromTruthsayer.sendMessage({
      type: 'GET_APP_SETTINGS_REQUEST',
    })
    log.debug('Got saved settings', response.settings)
    setAppSettings(response.settings)
  }, [archaeologistState])

  const saveAppSettings = React.useCallback(
    async (newAppSettings: AppSettings) => {
      log.debug('Save new settings', newAppSettings)
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
            `${JSON.stringify(appSettings)} vs ${JSON.stringify(
              newAppSettings
            )}`
        )
      }
    },
    [appSettings]
  )
  const toggleStorageType = async (checked: boolean) => {
    await saveAppSettings({
      ...(appSettings ?? defaultSettings()),
      storageType: checked ? 'browser_ext' : 'datacenter',
    })
  }
  const toggleTypingSuggestionsEnabled = async (enabled: boolean) => {
    const prev = appSettings ?? defaultSettings()
    await saveAppSettings({
      ...prev,
      suggestions: {
        ...prev.suggestions,
        typing: { enabled },
      },
    })
  }
  const toggleMouseoverSuggestionsEnabled = async (enabled: boolean) => {
    const prev = appSettings ?? defaultSettings()
    await saveAppSettings({
      ...prev,
      suggestions: {
        ...prev.suggestions,
        mouseover: { enabled },
      },
    })
  }
  const ctx = React.useContext(MzdGlobalContext)
  const [storageToggleIsEnabled] = React.useState<boolean>(
    (process.env.NODE_ENV === 'development' ||
      ctx.analytics?.isFeatureEnabled('local-storage-toggle')) ??
      false
  )
  const storageTypeToggle =
    appSettings !== null ? (
      <Section key="storage_type">
        <SectionLabel>Storage type</SectionLabel>
        <FeatureRow>
          <Switch
            disabled={!storageToggleIsEnabled}
            onChange={toggleStorageType}
            checked={appSettings.storageType === 'browser_ext'}
          />
          <FeatureLabel>Store data locally</FeatureLabel>
        </FeatureRow>
      </Section>
    ) : null

  return (
    <Box className={className}>
      <PageTitle>Settings</PageTitle>
      <Section key="augmentation">
        <SectionLabel>Suggest relevant memories</SectionLabel>
        <FeatureRow>
          <Switch
            onChange={toggleTypingSuggestionsEnabled}
            checked={
              appSettings?.suggestions?.typing?.enabled ?? isLikelyAuthorised
            }
          />
          <FeatureLabel>Suggest when typing</FeatureLabel>
        </FeatureRow>
        <FeatureRow>
          <Switch
            onChange={toggleMouseoverSuggestionsEnabled}
            checked={
              appSettings?.suggestions?.mouseover?.enabled ?? isLikelyAuthorised
            }
          />
          <FeatureLabel>Suggest on hover over known link</FeatureLabel>
        </FeatureRow>
      </Section>
      {storageTypeToggle}
    </Box>
  )
}
