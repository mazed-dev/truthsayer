/** @jsxImportSource @emotion/react */
import React from 'react'
import styled from '@emotion/styled'

import { Link } from 'react-router-dom'

import { ButtonGroup, Dropdown, Navbar } from 'react-bootstrap'

import { UserAccount } from 'smuggler-api'
import lodash from 'lodash'

import { MdiAccountCircle, kCardBorder, ForewordName } from 'elementary'
import { SearchForm } from './SearchForm'
import { TruthsayerPath } from './../lib/route'

const UserPic = styled(MdiAccountCircle)`
  vertical-align: middle;
  font-size: 24px;
`

const UserBadgeBox = styled.div`
  display: flex;
`
const UserNameBox = styled.span`
  padding: 0 8px 0 5px;
  @media (max-width: 450px) {
    display: none;
  }
`

const UserBadge = ({ username }: { username?: string }) => {
  // TODO: use custom user uploaded picture for userpic here
  return (
    <UserBadgeBox>
      {username ? (
        <UserNameBox>{lodash.upperFirst(username)}</UserNameBox>
      ) : null}
      <UserPic />
    </UserBadgeBox>
  )
}

const DropdownItemLink = ({
  to,
  children,
  className,
}: React.PropsWithChildren<{ to: TruthsayerPath; className?: string }>) => {
  return (
    <Dropdown.Item as={Link} to={to} className={className}>
      {children}
    </Dropdown.Item>
  )
}

const AccountDropdownToggle = styled(Dropdown.Toggle)`
  background-color: #ffffff;

  border-style: solid;
  border-width: 0px;
  border-radius: 56px;

  padding: 5px;

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
  return (
    <Dropdown as={ButtonGroup} navbar drop="start">
      <AccountDropdownToggle variant="light">
        <UserBadge username={username} />
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
          <DropdownItemLink to={'/logout'}>Log Out</DropdownItemLink>
        ) : (
          <DropdownItemLink
            to={'/login'}
            css={{
              backgroundColor: '#ffe7e7',
            }}
          >
            Log In
          </DropdownItemLink>
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
  margin: 0 8px 0 8px;
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
          <NavbarBrandName />
        </NavbarBrand>
        <SearchForm />
        <NavButtons isLikelyAuthorised={isLikelyAuthorised} account={account} />
      </CustomNavbar>
      <NavbarFiller />
    </>
  )
}
