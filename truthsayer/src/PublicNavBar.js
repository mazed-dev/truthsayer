import React from 'react'

// React router
import { Link } from 'react-router-dom'

import { Nav, Navbar } from 'react-bootstrap'

import { withRouter } from 'react-router-dom'

function PublicNavBar() {
  return (
    <Navbar
      bg="light"
      variant="light"
      collapseOnSelect
      expand="lg"
      size="sm"
      className="pt-0 pb-1 px-0"
    >
      <Navbar.Brand as={Link} to="/">
        <span role="img" aria-label="next">
          &#x1F9F5;
        </span>
        &nbsp; Mazed
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-public-navbar" />
      <Navbar.Collapse id="responsive-public-navbar">
        <Nav>
          <Nav.Link as={Link} to="/terms-of-service">
            Terms of service
          </Nav.Link>
          <Nav.Link as={Link} to="/privacy-policy">
            Privacy policy
          </Nav.Link>
          <Nav.Link as={Link} to="/contacts">
            Contact us
          </Nav.Link>
        </Nav>
        <Nav className="ml-auto">
          <Nav.Link as={Link} to="/signup">
            Sign up
          </Nav.Link>
          <Nav.Link as={Link} to="/login">
            Log in
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default withRouter(PublicNavBar)
