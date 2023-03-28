/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import { kCardBorder } from 'elementary'

import {
  MicrosoftOfficeOneDriveImporter,
  MicrosoftOfficeOneDriveLogoImg,
} from './third-party-filesystem/MicrosoftOfficeOneDriveImporter'
import {
  BrowserHistoryImportConfig,
  BrowserHistoryImporter,
} from './BrowserHistoryImporter'
import BrowserLogo from '../apps-list/img/GoogleChromeLogo.svg'
import { DataCentreImporter, getLogoImage } from './DataCentreImporter'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import { OpenTabsImporter } from './OpenTabsImporter'
import { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'

const Box = styled.div`
  padding: 18px;

  display: flex;
  justify-content: center;
  align-items: center;
`

const ItemsBox = styled.div`
  width: min(80vw, 840px);
`

const Item = styled.div`
  width: 100%;
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

const LogoImg = styled.img`
  width: 64px;
  height: 64px;
  margin: 4px 24px 4px 4px;
`

export type ExternalImportType =
  | 'browser-history'
  | 'open-tabs'
  | 'onedrive'
  | 'data-centre-importer'

export type ExternalImportProgress = {
  openTabsProgress: BackgroundActionProgress
  historyImportProgress: BackgroundActionProgress
}

export function ExternalImport({
  className,
  archaeologistState,
  progress,
  browserHistoryImportConfig,
  importTypes, // if unspecified, show all types availiable
}: {
  className?: string
  archaeologistState: ArchaeologistState
  progress: ExternalImportProgress
  browserHistoryImportConfig: BrowserHistoryImportConfig
  importTypes?: ExternalImportType[]
}) {
  const isFinished = (progress: BackgroundActionProgress) =>
    progress.total !== 0 && progress.total === progress.processed
  const itemsByKey = {
    'browser-history': (
      <Item key={'browser-history'}>
        <LogoImg src={BrowserLogo} />
        <BrowserHistoryImporter
          archaeologistState={archaeologistState}
          progress={progress.historyImportProgress}
          {...browserHistoryImportConfig}
          disabled={isFinished(progress.historyImportProgress)}
        />
      </Item>
    ),
    'open-tabs': (
      <Item key={'open-tabs'}>
        <LogoImg src={BrowserLogo} />
        <OpenTabsImporter
          archaeologistState={archaeologistState}
          progress={progress.openTabsProgress}
          disabled={isFinished(progress.openTabsProgress)}
        />
      </Item>
    ),
    onedrive: (
      <Item key={'onedrive'}>
        <LogoImg src={MicrosoftOfficeOneDriveLogoImg} />
        <MicrosoftOfficeOneDriveImporter />
      </Item>
    ),
    'data-centre-importer': (
      <Item key={'data-centre-importer'}>
        <LogoImg src={getLogoImage()} />
        <DataCentreImporter />
      </Item>
    ),
  }
  importTypes = importTypes ?? [
    'open-tabs',
    'browser-history',
    'onedrive',
    'data-centre-importer',
  ]
  return (
    <Box className={className}>
      <ItemsBox>{importTypes.map((t) => itemsByKey[t])}</ItemsBox>
    </Box>
  )
}
