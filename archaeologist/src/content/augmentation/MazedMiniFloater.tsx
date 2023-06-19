/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import LogoImage from '../../../public/logo-strip.svg'
import { HoverTooltip } from 'elementary'
import { InsertLink } from '@emotion-icons/material'

const Box = styled.div<{ notify: boolean }>`
  position: relative;
  height: 24px;
  width: 24px;
  border-radius: 50%;

  border: 1px solid #ececec;
  background-image: ${({ notify }) =>
    notify
      ? 'linear-gradient(#54a3ff, #006eed)'
      : 'linear-gradient(#d7d7d7, #bbbbbb)'};
  box-shadow: 2px 2px 4px #8c8c8ceb;

  user-select: none;
  cursor: pointer;
  pointer-events: all;

  z-index: 1024;

  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Logo = styled.div`
  position: absolute;
  top: calc(50% - 6.25px);
  left: calc(50% - 6.25px);
  width: 12.5px;
  height: 12.5px;

  margin: 0;
  padding: 0;

  background-color: #ffffffeb;
  mask: url(${LogoImage}) no-repeat center;
`

const BadgeText = styled.span`
  font-size: 12px;
  letter-spacing: 0;
  color: white;

  text-align: center;
  color: white;
  font-weight: bold;
  text-decoration: none;
`

const LinkIcon = styled(InsertLink)`
  padding-right: 1px;
`

export const MazedMiniFloater = ({
  onClick,
  text,
}: {
  onClick: (event: React.MouseEvent) => void
  text?: string
}) => {
  if (text == null) {
    return (
      <HoverTooltip tooltip="Foreword" placement="bottom-left">
        <Box onClick={onClick} notify={false}>
          <Logo />
        </Box>
      </HoverTooltip>
    )
  } else {
    return (
      <HoverTooltip
        tooltip="Relavant memories from Foreword"
        placement="bottom-left"
      >
        <Box onClick={onClick} notify={true}>
          <BadgeText>
            <LinkIcon size={10} />
            {text}
          </BadgeText>
        </Box>
      </HoverTooltip>
    )
  }
}
