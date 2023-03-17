/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { HoverTooltip } from './HoverTooltip'
import { ContentCopy as CopyIcon } from '@emotion-icons/material'

type Props = React.PropsWithChildren<{
  onClick: () => void
  tooltip?: string
}>

const Btn = styled.button`
  padding: 4px;

  position: absolute;
  bottom: 0;
  right: 0;
  transform: translate(-1%, -1%);

  zindex: 1;

  visibility: hidden;
  transition: 0s visibility;

  border-style: solid;
  border-width: 0;
  border-radius: 18px;

  background: rgba(0, 0, 0, 0.05);

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`
const kBtnId =
  'mazed-lz89dzqweagmecanst2ax3d3q41j0rmjzrqavt9k5sotavwz3obqq4qrwvorftuc'
const Box = styled.div`
  position: relative;
  &:hover #${kBtnId} {
    visibility: visible;
    transition-delay: 0.2s;
  }
`

export const OverlayCopyOnHover = ({ children, onClick, tooltip }: Props) => {
  return (
    <Box>
      {children}
      <Btn onClick={onClick} id={kBtnId}>
        <HoverTooltip
          tooltip={tooltip ?? 'Copy to Clipboard'}
          placement="bottom-left"
        >
          <CopyIcon size={'1.2em'} />
        </HoverTooltip>
      </Btn>
    </Box>
  )
}
