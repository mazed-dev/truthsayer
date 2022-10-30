/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import { kCardBorder } from 'elementary'

import {
  MicrosoftOfficeOneDriveImporter,
  MicrosoftOfficeOneDriveLogoImg,
} from './third-party-filesystem/MicrosoftOfficeOneDriveImporter'
import {
  BrowserHistoryImporter,
  BrowserLogo as BrowserHistoryImporterLogo,
} from './BrowserHistoryImporter'

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
  browserHistoryImportModes: historyImportModes,
}: {
  className?: string
  browserHistoryImportModes: ('untracked' | 'resumable')[]
}) {
  return (
    <Box className={className}>
      <ItemsBox>
        <Item key={'browser-history'}>
          <LogoImg src={BrowserHistoryImporterLogo} />
          <BrowserHistoryImporter modes={historyImportModes} />
        </Item>
        <Item key={'onedrive'}>
          <LogoImg src={MicrosoftOfficeOneDriveLogoImg} />
          <MicrosoftOfficeOneDriveImporter />
        </Item>
      </ItemsBox>
    </Box>
  )
}
