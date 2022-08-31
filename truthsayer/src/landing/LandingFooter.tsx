/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { Link } from 'react-router-dom'

import { getLogoImage } from './../util/env'
import { routes } from './../lib/route'

const FooterItem = styled(Link)`
  display: flex;
  color: black;
  text-decoration: none;
  font-size: 16px;
  margin: auto 0.5em auto 0.5em;
  &:hover {
    text-decoration: none;
    color: black;
    opacity: 0.9;
  }
`
function FooterLogo() {
  return (
    <FooterItem
      to="/"
      css={css`
        font-size: 24px;
        margin: auto 0.2em auto 0.2em;
      `}
    >
      <img
        src={getLogoImage()}
        alt={'Mazed'}
        css={css`
          width: 1.2em;
        `}
      />
    </FooterItem>
  )
}

const Box = styled.div`
  display: flex;
  justify-content: left;
  padding: 12px 12px 12px 12px;
  position: absolute;
  bottom: 0;
  font-family: 'Comfortaa';
`

export function LandingFooter() {
  return (
    <Box>
      <FooterLogo />
      <FooterItem to={routes.terms}>Terms</FooterItem>
      <FooterItem to={routes.privacy}>Privacy</FooterItem>
      <FooterItem to={routes.faq}>FAQs</FooterItem>
      <FooterItem to={routes.api}>API</FooterItem>
      <FooterItem to={routes.contacts}>Contact us</FooterItem>
    </Box>
  )
}
