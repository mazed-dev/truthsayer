import React from 'react'
import styled from '@emotion/styled'

import { Link, useLocation } from 'react-router-dom'

import { ButtonGroup, Dropdown, Navbar } from 'react-bootstrap'

import { compass } from './../lib/route'
import { jcss, MdiAccountCircle, kCardBorder, ForewordName } from 'elementary'
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

const PrivateNavButtons = () => {
  const location = useLocation()
  let { query } = compass.search.get({ location })
  if (Array.isArray(query)) {
    query = query.join(' ')
  }
  const userpic = <UserBadge />
  return (
    <>
      <SearchForm from={query} className={styles.search_form} />

      <Dropdown as={ButtonGroup} navbar drop="start">
        <Dropdown.Toggle
          variant="light"
          className={jcss(styles.account_dropdown_toggle)}
        >
          {userpic}
        </Dropdown.Toggle>

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
          <DropdownItemLink to={'/logout'}>Log out</DropdownItemLink>
        </Dropdown.Menu>
      </Dropdown>
    </>
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
  width: 30px;
  height: 30px;
  margin-right: 12px;
`

export function GlobalNavBar() {
  return (
    <>
      <CustomNavbar fixed="top" className={styles.navbar}>
        <NavbarBrand as={Link} to="/">
          <NavbarBrandLogo
            src={getLogoImage()}
            alt={'Foreword logo'}
            className={styles.logo_image}
          />
          <NavbarBrandName />
        </NavbarBrand>
        <PrivateNavButtons />
      </CustomNavbar>
      <div className={styles.navbar_filler} />
    </>
  )
}
