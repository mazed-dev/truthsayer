/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { Link } from 'react-router-dom'

import { getLogoImage } from './../util/env'
import { TruthsayerPath } from './../lib/route'

const ItemBox = styled(Link)`
  display: flex;
  color: black;
  text-decoration: none;
  font-size: 16px;
  margin: auto 8px auto 8px;
  &:hover {
    text-decoration: none;
    color: black;
    opacity: 0.9;
  }
`
function Item({
  to,
  children,
  className,
}: React.PropsWithChildren<{ to: TruthsayerPath; className?: string }>) {
  return (
    <ItemBox to={to} className={className}>
      {children}
    </ItemBox>
  )
}
function Logo() {
  return (
    <Item
      to="/"
      css={css`
        font-family: 'Comfortaa';
        font-size: 20px;
        margin: auto 12px auto 2px;
      `}
    >
      <img
        src={getLogoImage()}
        alt={'Mazed'}
        css={css`
          width: 1.2em;
          margin-right: 8px;
        `}
      />
      Mazed
    </Item>
  )
}

const Bar = styled.div`
  display: flex;
  justify-content: left;
  padding: 18px 12px 18px 12px;

  width: 100%;
  background-color: white;
`

const Filler = styled.div`
  width: 100%;
`

export function PublicPageNavbar() {
  return (
    <div>
      <Bar>
        <Logo />
        <Item to={'/terms-of-service'}>Terms And Conditions</Item>
        <Item to={'/privacy-policy'}>Privacy Policy</Item>
        <Item to={'/cookie-policy'}>Cookie Policy</Item>
        <Item to={'/contacts'}>Contact Us</Item>
      </Bar>
      <Filler />
    </div>
  )
}
