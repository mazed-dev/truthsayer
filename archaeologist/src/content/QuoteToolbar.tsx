import React, { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { StyleButtonWhite } from 'elementary'

import { mazed } from '../util/mazed'

import LogoImage from '../../public/logo-48x48.png'

// All CSS properties are tagged as `!important` here to protect Mazed
// augmentation against overrides from WebPage CSS.

//border: 1px solid ${HighlightColour.Green}7f;
const Box = styled.div`
  display: flex;
  margin: 4px;
  background: #ffffff !important;
  border: 1px solid #ececec !important;
  border-radius: 8px;
  color: black;
`

const ItemCommon = css`
  display: inline-block;
  margin: 4px 2px 4px 0;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  ${StyleButtonWhite};
`

const BtnItem = styled.div`
  ${ItemCommon}
  display: none;
`

const RefItem = styled.a`
  ${ItemCommon}

  &:hover: {
    text-decoration: none !important;
  }
`

const Logo = styled.img`
  width: 20px;
  height: 20px;
  margin: auto 2px auto 2px;
  padding: 4px;
`

export const QuoteToolbar = ({
  nid,
  onExit,
}: {
  nid: string
  onExit: () => void
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const clickListener = (event: MouseEvent) => {
    const { target } = event
    if (target && !ref?.current?.contains(target as Node)) {
      onExit()
    }
  }
  useEffect(() => {
    document.addEventListener('mousedown', clickListener, {
      capture: false,
      passive: true,
    })

    return () => {
      document.removeEventListener('mousedown', clickListener, {
        capture: false,
      })
    }
  })
  const truthsayerNodeUrl = mazed.makeNodeUrl(nid).toString()
  return (
    <Box ref={ref}>
      <Logo src={LogoImage} />
      <RefItem href={truthsayerNodeUrl}>Open</RefItem>
      <BtnItem>Delete</BtnItem>
    </Box>
  )
}
