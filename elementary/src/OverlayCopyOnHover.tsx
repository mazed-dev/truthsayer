/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { HoverTooltip } from './HoverTooltip'
import { ContentCopy as CopyIcon } from '@emotion-icons/material'

type Props = React.PropsWithChildren<{
  getTextToCopy: () => string | null
  tooltip?: string
}>

const Btn = styled.button`
  padding: 5px;

  position: absolute;
  top: 0;
  right: 0;
  transform: translate(-10%, -24%);

  display: flex;
  align-content: center;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;

  zindex: 1;

  visibility: hidden;
  transition: 0s visibility;

  border-style: solid;
  border-width: 0;
  border-radius: 18px;

  background: rgba(0, 0, 0, 0.12);
  opacity: 0.4;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`
const kBtnId =
  'mazed-lz89dzqweagmecanst2ax3d3q41j0rmjzrqavt9k5sotavwz3obqq4qrwvorftuc'
const Box = styled.div`
  position: relative;
  &:hover #${kBtnId} {
    visibility: visible;
    transition-delay: 0.1s;
  }
`

export const OverlayCopyOnHover = ({
  children,
  getTextToCopy,
  tooltip,
}: Props) => {
  const [tooltipText, setTooltipText] = React.useState<string>(
    tooltip ?? 'Copy to Clipboard'
  )
  const onClickReal = () => {
    const textToCopy = getTextToCopy()
    if (textToCopy != null) {
      navigator.clipboard.writeText(textToCopy)
      setTooltipText('Copied')
    }
  }
  return (
    <Box>
      {children}
      <Btn onClick={onClickReal} id={kBtnId}>
        <HoverTooltip
          tooltip={tooltipText}
          transitionDelaySec={0.21}
          placement="bottom-left"
        >
          <CopyIcon size={'1em'} />
        </HoverTooltip>
      </Btn>
    </Box>
  )
}
