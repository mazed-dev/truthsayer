/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import { kCardBorder } from 'elementary'
import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'

import {
  MicrosoftOfficeOneDriveImporter,
  MicrosoftOfficeOneDriveLogoImg,
} from './third-party-filesystem/MicrosoftOfficeOneDriveImporter'
import {
  BrowserHistoryImporter,
  BrowserLogo as BrowserHistoryImporterLogo,
} from './BrowserHistoryImporter'
import { DataCentreImporter, getLogoImage } from './DataCentreImporter'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import { OpenTabsImporter } from './OpenTabsImporter'
import {
  BackgroundActionProgress,
  FromArchaeologistContent,
} from 'truthsayer-archaeologist-communication'
import { log } from 'armoury'

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

export function ExternalImport({
  className,
  archaeologistState,
  browserHistoryImportConfig,
}: {
  className?: string
  archaeologistState: ArchaeologistState
  browserHistoryImportConfig: truthsayer_archaeologist_communication.BrowserHistoryImport.Config
}) {
  const [openTabsProgress, setOpenTabsProgress] =
    React.useState<BackgroundActionProgress>({
      processed: 0,
      total: 0,
    })
  React.useEffect(() => {
    const listener = (event: MessageEvent) => {
      // Only accept messages sent from archaeologist's content script
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
            }
          }
        }
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  })

  return (
    <Box className={className}>
      <ItemsBox>
        <Item key={'browser-history'}>
          <LogoImg src={BrowserHistoryImporterLogo} />
          <BrowserHistoryImporter
            archaeologistState={archaeologistState}
            {...browserHistoryImportConfig}
          />
        </Item>
        <Item key={'open-tabs'}>
          <LogoImg src={BrowserHistoryImporterLogo} />
          <OpenTabsImporter
            archaeologistState={archaeologistState}
            progress={openTabsProgress}
          />
        </Item>
        <Item key={'onedrive'}>
          <LogoImg src={MicrosoftOfficeOneDriveLogoImg} />
          <MicrosoftOfficeOneDriveImporter />
        </Item>
        <Item key={'data-centre-importer'}>
          <LogoImg src={getLogoImage()} />
          <DataCentreImporter />
        </Item>
      </ItemsBox>
    </Box>
  )
}
