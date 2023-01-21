/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import { DownloadAsFile } from './DownloadAsFile'

import { kCardBorder, MdiSave } from 'elementary'

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
const SaveIcon = styled(MdiSave)`
  margin: 14px;
  font-size: 20px;
`
export function Export({ className }: { className?: string }) {
  return (
    <Box className={className}>
      <ItemsBox>
        <Item key={'download-as-a-file'}>
          <SaveIcon />
          <DownloadAsFile />
        </Item>
      </ItemsBox>
    </Box>
  )
}
