/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import LogoImage from '../../../public/logo-strip.svg'
import { ContentContext } from '../context'
import { StyleButtonCreate } from 'elementary'
import { log } from 'armoury'

const Box = styled.div`
  position: relative;
  height: 32px;
  width: 32px;
  border-radius: 50%;

  border: 1px solid #ececec;
  background-image: linear-gradient(#54a3ff, #006eed);
  box-shadow: 2px 2px 4px #8c8c8ceb;

  margin-right: 4px;

  user-select: none;
  cursor: pointer;
  pointer-events: all;

  z-index: 1024;
`

const Logo = styled.div`
  position: absolute;
  top: calc(50% - 10px);
  left: calc(50% - 10.5px);
  width: 20px;
  height: 20px;

  margin: 0;
  padding: 0;

  background-color: #ffffffeb;
  mask: url(${LogoImage}) no-repeat center;
}
`

const BadgeBubble = styled.div`
  width: 28px;
  height: 28px;

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
  font-size: 14px;
  letter-spacing: 0;
  color: white;
`

export const MazedMiniFloater = ({
  onClick,
  children,
}: React.PropsWithChildren<{
  onClick: (event: React.MouseEvent) => void
}>) => {
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
    <BadgeBubble onClick={onMeteredClick}
    >
      <BadgeText>{children}</BadgeText>
    </BadgeBubble>
  )
}
