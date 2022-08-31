import React, { useContext } from 'react'
import styled from '@emotion/styled'

import { Link, useLocation } from 'react-router-dom'

import { ButtonGroup, Dropdown, Navbar } from 'react-bootstrap'

import { compass } from './../lib/route'
import { jcss, MdiAccountCircle, kCardBorder } from 'elementary'
import { getLogoImage } from './../util/env'
import { SearchForm } from './SearchForm'
import { MzdGlobalContext } from '../lib/global'
import { routes } from './../lib/route'

import styles from './GlobalNavBar.module.css'

const UserPic = styled(MdiAccountCircle)`
  vertical-align: middle;
  font-size: 24px;
`

const UserBadge = () => {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  // TODO: use custom user uploaded picture for userpic here
  return (
    <div className={'d-inline-flex'}>
      <UserPic />
      <div className="d-none d-sm-none d-md-block">
        &nbsp;
        {account?.getName()}
      </div>
    </div>
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
          <Dropdown.Item as={Link} to={routes.settings}>
            Settings
          </Dropdown.Item>
          <Dropdown.Item as={Link} to={routes.apps}>
            Apps
          </Dropdown.Item>
          <Dropdown.Item as={Link} to={routes.integrations}>
            Integrations
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as={Link} to={routes.faq}>
            FAQs
          </Dropdown.Item>
          <Dropdown.Item as={Link} to={routes.about}>
            About
          </Dropdown.Item>
          <Dropdown.Item as={Link} to={routes.privacy}>
            Privacy Policy
          </Dropdown.Item>
          <Dropdown.Item as={Link} to={routes.terms}>
            Terms of Service
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as={Link} to={routes.logout}>
            Log out
          </Dropdown.Item>
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
`

const NavbarBrand = styled(Navbar.Brand)`
  display: flex;
  justify-content: space-between;
  margin-right: 0.5rem;
  font-family: 'Comfortaa';
`

export function GlobalNavBar() {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null || !account.isAuthenticated()) {
    return null
  }
  return (
    <>
      <CustomNavbar fixed="top" className={styles.navbar}>
        <NavbarBrand as={Link} to="/">
          <img
            src={getLogoImage()}
            alt={'Mazed logo'}
            className={styles.logo_image}
          />
          <div className="d-none d-sm-none d-md-block">Mazed</div>
        </NavbarBrand>
        <PrivateNavButtons />
      </CustomNavbar>
      <div className={styles.navbar_filler} />
    </>
  )
}
