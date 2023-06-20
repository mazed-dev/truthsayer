import React from 'react'
import styled from '@emotion/styled'

import { Link } from 'react-router-dom'

import { ButtonGroup, Dropdown, Navbar } from 'react-bootstrap'

import { UserAccount } from 'smuggler-api'

import { MdiAccountCircle, kCardBorder, ForewordName } from 'elementary'
import { getLogoImage } from './../util/env'
import { SearchForm } from './SearchForm'
import { TruthsayerPath } from './../lib/route'

import styles from './GlobalNavBar.module.css'
import { productanalytics } from 'armoury'

const UserPic = styled(MdiAccountCircle)`
  vertical-align: middle;
  font-size: 24px;
`

const UserBadge = () => {
  // TODO: use custom user uploaded picture for userpic here
  return (
    <div className={'d-inline-flex'}>
      <UserPic />
      <div
        className={productanalytics.classExclude('d-none d-sm-none d-md-block')}
      ></div>
    </div>
  )
}

const DropdownItemLink = ({
  to,
  children,
}: React.PropsWithChildren<{ to: TruthsayerPath }>) => {
  return (
    <Dropdown.Item as={Link} to={to}>
      {children}
    </Dropdown.Item>
  )
}

const AccountDropdownToggle = styled(Dropdown.Toggle)`
  background-color: #ffffff;

  border-style: solid;
  border-width: 0px;
  border-radius: 56px;

  padding-top: 8px;
  padding-right: 4px;
  padding-left: 4px;
  padding-bottom: 4px;

  margin-right: 0.2rem;

  &:hover {
    opacity: 1;
    background-color: #d0d1d2;
  }
  &:after {
    display: none !important;
  }
  &:before {
    display: none !important;
  }
`

const NavButtons = ({
  isLikelyAuthorised,
  account,
}: {
  isLikelyAuthorised: boolean
  account?: UserAccount
}) => {
  const username = account?.getName()
  const userpic = <UserBadge />
  return (
    <Dropdown as={ButtonGroup} navbar drop="start">
      <AccountDropdownToggle variant="light">
        {username}
        {userpic}
      </AccountDropdownToggle>

      <Dropdown.Menu>
        <DropdownItemLink to={'/settings'}>Settings</DropdownItemLink>
        <DropdownItemLink to={'/apps-to-install'}>Apps</DropdownItemLink>
        <DropdownItemLink to={'/external-import'}>Import</DropdownItemLink>
        <DropdownItemLink to={'/export'}>Export</DropdownItemLink>
        <Dropdown.Divider />
        <DropdownItemLink to={'/faq'}>FAQs</DropdownItemLink>
        <DropdownItemLink to={'/about'}>About</DropdownItemLink>
        <DropdownItemLink to={'/privacy-policy'}>
          Privacy Policy
        </DropdownItemLink>
        <DropdownItemLink to={'/terms-of-service'}>
          Terms of Service
        </DropdownItemLink>
        <Dropdown.Divider />
        {isLikelyAuthorised ? (
          <DropdownItemLink to={'/logout'}>Log out</DropdownItemLink>
        ) : (
          <DropdownItemLink to={'/login'}>Log In</DropdownItemLink>
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}

const CustomNavbar = styled(Navbar)`
  background-color: white;
  height: 2.8rem;
  padding-left: 0.8rem;
  padding-right: 0.8rem;
  justify-content: space-between;
  ${kCardBorder};
  z-index: 10000;
`

const NavbarBrand = styled(Navbar.Brand)`
  display: flex;
  justify-content: space-between;
  margin-right: 0.5rem;
`
const NavbarBrandName = styled(ForewordName)`
  margin: 0 8px 0 10px;
`
const NavbarBrandLogo = styled.img`
  margin-top: auto;
  margin-bottom: auto;
  margin-left: 2px;
  margin-right: 6px;

  width: 30px;
  height: 30px;
  margin-right: 12px;
`

const NavbarFiller = styled.div`
  margin-bottom: 3.4rem;
  width: 100%;
`

export function GlobalNavBar({
  isLikelyAuthorised,
  account,
}: {
  isLikelyAuthorised: boolean
  account?: UserAccount
}) {
  return (
    <>
      <CustomNavbar fixed="top">
        <NavbarBrand as={Link} to="/">
          <NavbarBrandLogo
            src={getLogoImage()}
            alt={'Foreword logo'}
          />
          <NavbarBrandName />
        </NavbarBrand>
        <SearchForm />
        <NavButtons isLikelyAuthorised={isLikelyAuthorised} account={account} />
      </CustomNavbar>
      <NavbarFiller />
    </>
  )
}
