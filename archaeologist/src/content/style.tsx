import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { StyleButtonWhite, ColourButtonWhite } from 'elementary'

import LogoImage from '../../public/logo-48x48.png'

// All CSS properties are tagged as `!important` here to protect Mazed
// augmentation against overrides from WebPage CSS.

export const Box = styled.div`
  display: flex !important;
  width: max-content !important;
  margin: 4px !important;
  background: #ffffff !important;
  border: 1px solid #ececec !important;
  border-radius: 28px !important;
  color: black !important;
  box-shadow: 2px 2px 4px #8c8c8ceb;
`

const ItemCommon = css`
  display: inline-block !important;
  padding: 8px !important;
  border-radius: 28px !important;
  border-width: 0px !important;
  cursor: pointer !important;
  font-size: 14px !important;
  box-shadow: none !important;

  margin: auto 0 auto 2px !important;
  &:last-child {
    margin-right: 6px !important;
  }
`
export const ButtonItem = styled.div`
  ${ItemCommon};
  ${StyleButtonWhite};
`

export const RefItem = styled.a`
  ${ItemCommon};
  color: ${ColourButtonWhite.Foreground};
  &:hover {
    text-decoration: underline !important;
  }
  &:focus {
    text-decoration: underline !important;
  }
`

const LogoSmallImg = styled.img`
  width: 20px !important;
  height: 20px !important;
  margin: auto 2px auto 10px !important;
  padding: 0 !important;
`

export const LogoSmall = ({ className }: { className?: string }) => (
  <LogoSmallImg src={LogoImage} className={className} />
)
