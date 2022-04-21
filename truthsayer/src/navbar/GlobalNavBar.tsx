import React, { useContext } from 'react'
import styled from '@emotion/styled'

import { Link, useLocation } from 'react-router-dom'

import { ButtonGroup, Dropdown, Navbar, Nav } from 'react-bootstrap'

import { compass } from './../lib/route'
import { jcss, MdiAccountCircle, kCardBorder } from 'elementary'
import { getLogoImage } from './../dev/env'
import { SearchForm } from './SearchForm'
import { MzdGlobalContext } from '../lib/global'

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
          <Dropdown.Item as={Link} to="/user-preferences">
            Manage your account
          </Dropdown.Item>
          <Dropdown.Item as={Link} to="/3rdparty-integrations">
            [experimental] 3rd-party integrations
          </Dropdown.Item>
          <Dropdown.Item as={Link} to="/help">
            Help
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as={Link} to="/about">
            About knotledge
          </Dropdown.Item>
          <Dropdown.Item as={Link} to="/privacy-policy">
            Privacy Policy
          </Dropdown.Item>
          <Dropdown.Item as={Link} to="/terms-of-service">
            Terms of Service
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as={Link} to="/logout">
            log out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </>
  )
}

const PublicNavButtons = () => {
  return (
    <>
      <Navbar.Toggle aria-controls="responsive-public-navbar" />
      <Navbar.Collapse id="responsive-public-navbar">
        <Nav>
          <Nav.Link as={Link} to="/terms-of-service">
            Terms of service
          </Nav.Link>
          <Nav.Link as={Link} to="/contacts">
            Contact us
          </Nav.Link>
        </Nav>
        <Nav className="ml-auto">
          <Nav.Link as={Link} to="/login">
            Log in
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
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

export function GlobalNavBar() {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null) {
    return <></>
  }
  const buttons = account.isAuthenticated() ? (
    <PrivateNavButtons />
  ) : (
    <PublicNavButtons />
  )
  return (
    <>
      <CustomNavbar fixed="top" className={styles.navbar}>
        <Navbar.Brand as={Link} to="/" className={styles.brand}>
          <img
            src={getLogoImage()}
            alt={'Mazed logo'}
            className={styles.logo_image}
          />
          <div className="d-none d-sm-none d-md-block">Mazed</div>
        </Navbar.Brand>
        {buttons}
      </CustomNavbar>
      <div className={styles.navbar_filler} />
    </>
  )
}
