/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import LogoImage from '../../../public/logo-strip.svg'
import { ContentContext } from '../context'
import { HoverTooltip } from 'elementary'

const Box = styled.div<{ notify: boolean }>`
  position: relative;
  height: 26px;
  width: 26px;
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
  top: calc(50% - 7.3px);
  left: calc(50% - 7.5px);
  width: 15px;
  height: 15px;

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

export const MazedMiniFloater = ({
  onClick,
  text,
}: {
  onClick: (event: React.MouseEvent) => void
  text?: string
}) => {
  const ctx = React.useContext(ContentContext)
  const onMeteredClick = React.useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLDivElement
      ctx.analytics?.capture('MazedMiniFloater:Click', {
        targetTagName: target?.tagName.toLowerCase(),
      })
      onClick(event)
    },
    [onClick, ctx]
  )
  if (text == null) {
    return (
      <HoverTooltip tooltip="Mazed" placement="bottom-left">
        <Box onClick={onMeteredClick} notify={false}>
          <Logo />
        </Box>
      </HoverTooltip>
    )
  } else {
    return (
      <HoverTooltip
        tooltip="Relavant memories from Mazed"
        placement="bottom-left"
      >
        <Box onClick={onMeteredClick} notify={true}>
          <BadgeText>{text}</BadgeText>
        </Box>
      </HoverTooltip>
    )
  }
}
