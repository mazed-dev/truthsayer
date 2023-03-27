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

export function ExternalImport({
  className,
  archaeologistState,
  browserHistoryImportConfig,
  importTypes, // if unspecified, show all types availiable
  onFinish,
}: {
  className?: string
  archaeologistState: ArchaeologistState
  browserHistoryImportConfig: BrowserHistoryImportConfig
  importTypes?: ExternalImportType[]
  onFinish?: (extImportType: ExternalImportType) => void
}) {
  const [historyImportProgress, setHistoryImportProgress] =
    React.useState<BackgroundActionProgress>({
      processed: 0,
      total: 0,
    })
  const [openTabsProgress, setOpenTabsProgress] =
    React.useState<BackgroundActionProgress>({
      processed: 0,
      total: 0,
    })
  React.useEffect(() => {
    const listener = (event: MessageEvent) => {
      // Only accept messages sent from archaeologist's content script
      // eslint-disable-next-line eqeqeq
      if (event.source != window) {
        return
      }

      // Discard any events that are not part of truthsayer/archaeologist
      // business logic communication
      const request = event.data
      if (!FromArchaeologistContent.isRequest(request)) {
        return
      }

      switch (request.type) {
        case 'REPORT_BACKGROUND_OPERATION_PROGRESS': {
          switch (request.operation) {
            case 'open-tabs-upload': {
              setOpenTabsProgress(request.newState)
              break
            }
            case 'browser-history-upload': {
              setHistoryImportProgress(request.newState)
              break
            }
          }
        }
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  })
  const itemsByKey = {
    'browser-history': (
      <Item key={'browser-history'}>
        <LogoImg src={BrowserLogo} />
        <BrowserHistoryImporter
          archaeologistState={archaeologistState}
          progress={historyImportProgress}
          onFinish={() => onFinish?.('browser-history')}
          {...browserHistoryImportConfig}
        />
      </Item>
    ),
    'open-tabs': (
      <Item key={'open-tabs'}>
        <LogoImg src={BrowserLogo} />
        <OpenTabsImporter
          archaeologistState={archaeologistState}
          onFinish={() => onFinish?.('open-tabs')}
          progress={openTabsProgress}
        />
      </Item>
    ),
    onedrive: (
      <Item key={'onedrive'}>
        <LogoImg src={MicrosoftOfficeOneDriveLogoImg} />
        <MicrosoftOfficeOneDriveImporter
          onFinish={() => onFinish?.('onedrive')}
        />
      </Item>
    ),
    'data-centre-importer': (
      <Item key={'data-centre-importer'}>
        <LogoImg src={getLogoImage()} />
        <DataCentreImporter
          onFinish={() => onFinish?.('data-centre-importer')}
        />
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
