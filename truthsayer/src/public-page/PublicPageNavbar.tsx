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
  letter-spacing: -0.02em;
  margin: 2px 5px 6px 5px;
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
  padding: 12px 12px 18px 12px;

  width: 100%;
  background-color: white;
`
const BarLeftHandItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  align-items: center;
  padding: 0;
  margin: 0;

  width: 84%;
`
const BarRightHandItems = styled.div`
  display: flex;
  justify-content: right;
  padding: 0;
  margin: 0;

  width: 16%;
`

const Filler = styled.div`
  width: 100%;
`

export function PublicPageNavbar() {
  return (
    <div>
      <Bar>
        <BarLeftHandItems>
          <Logo />
          <Item to={'/about'}>About</Item>
          <Item to={'/terms-of-service'}>Terms&nbsp;And&nbsp;Conditions</Item>
          <Item to={'/privacy-policy'}>Privacy&nbsp;Policy</Item>
          <Item to={'/cookie-policy'}>Cookie&nbsp;Policy</Item>
          <Item to={'/contacts'}>Contact&nbsp;Us</Item>
        </BarLeftHandItems>
        <BarRightHandItems>
          <Item to={'/login'}>Log&nbsp;In</Item>
        </BarRightHandItems>
      </Bar>
      <Filler />
    </div>
  )
}
