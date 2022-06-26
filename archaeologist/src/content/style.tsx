import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { StyleButtonWhite } from 'elementary'

import LogoImage from '../../public/logo-48x48.png'

// All CSS properties are tagged as `!important` here to protect Mazed
// augmentation against overrides from WebPage CSS.

//border: 1px solid ${HighlightColour.Green}7f;
export const Box = styled.div`
  display: flex !important;
  width: max-content !important;
  margin: 4px !important;
  background: #ffffff !important;
  border: 1px solid #ececec !important;
  border-radius: 12px !important;
  color: black !important;
  box-shadow: 2px 2px 4px #8c8c8ceb;
`

const ItemCommon = css`
  display: inline-block !important;
  padding: 8px !important;
  border-radius: 12px !important;
  border-width: 0px !important;
  cursor: pointer !important;
  font-size: 14px !important;
  box-shadow: none !important;
`
const ButtonItemCommon = css`
  ${StyleButtonWhite};
  margin: auto 2px auto 2px !important;
`

export const ButtonItem = styled.div`
  ${ItemCommon};
  ${ButtonItemCommon};
`

export const RefItem = styled.a`
  ${ItemCommon};
  ${ButtonItemCommon};
  &:hover: {
    text-decoration: none !important;
  }
`

export const TextItem = styled.div`
  ${ItemCommon};
  ${StyleButtonWhite};
  margin: auto 2px auto 2px !important;
`

const LogoSmallImg = styled.img`
  width: 20px !important;
  height: 20px !important;
  margin: auto 6px auto 6px !important;
  padding: 0 !important;

  opacity: 0.5 !important;
  div:hover & {
    opacity: 1 !important;
  }
`

export const LogoSmall = ({ className }: { className?: string }) => (
  <LogoSmallImg src={LogoImage} className={className} />
)
