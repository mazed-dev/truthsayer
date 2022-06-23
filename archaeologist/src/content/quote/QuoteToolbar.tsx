import React, { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { StyleButtonWhite } from 'elementary'

import { mazed } from '../../util/mazed'

import LogoImage from '../../../public/logo-48x48.png'

// All CSS properties are tagged as `!important` here to protect Mazed
// augmentation against overrides from WebPage CSS.

//border: 1px solid ${HighlightColour.Green}7f;
export const Box = styled.div`
  display: flex !important;
  width: max-content !important;
  margin: 4px !important;
  background: #ffffff !important;
  border: 1px solid #ececec !important;
  border-radius: 8px !important;
  color: black !important;
`

const ItemCommon = css`
  display: inline-block !important;
  margin: 4px 2px 4px 0 !important;
  padding: 8px !important;
  border-radius: 8px !important;
  border-width: 0px !important;
  cursor: pointer !important;
  font-size: 14px !important;
  ${StyleButtonWhite};
  box-shadow: none !important;
`

const BtnItem = styled.div`
  ${ItemCommon}
  display: none !important;
`

const RefItem = styled.a`
  ${ItemCommon}

  &:hover: {
    text-decoration: none !important;
  }
`

const Logo = styled.img`
  width: 20px !important;
  height: 20px !important;
  margin: auto 6px auto 6px !important;
  padding: 0 !important;
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
