/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import LogoImage from '../../../public/logo-strip.svg'
import { ContentContext } from '../context'
import { StyleButtonCreate } from 'elementary'

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

  margin-right: 4px;

  user-select: none;
  cursor: pointer;
  pointer-events: all;

  z-index: 1024;
`

const Logo = styled.div`
  position: absolute;
  top: calc(50% - 8px);
  left: calc(50% - 8.5px);
  width: 16px;
  height: 16px;

  margin: 0;
  padding: 0;

  background-color: #ffffffeb;
  mask: url(${LogoImage}) no-repeat center;
}
`

const BadgeBubble = styled.div`
  position: absolute;
  bottom: -3px;
  left: -3px;

  width: 14px;
  height: 14px;

  border-radius: 16px;

  ${StyleButtonCreate}

  text-align: center;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  text-decoration: none;
`

const BadgeText = styled.span`
  font-size: 11px;
  letter-spacing: 0;
  color: white;
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
  return (
    <Box onClick={onMeteredClick} notify={text != null}>
      <Logo />
      {text == null ? null : (
        <BadgeBubble>
          <BadgeText>{text}</BadgeText>
        </BadgeBubble>
      )}
    </Box>
  )
}
