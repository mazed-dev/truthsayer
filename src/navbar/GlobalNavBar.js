import React, { useContext } from 'react'

import styles from './GlobalNavBar.module.css'

// React router
import { Link } from 'react-router-dom'

import {
  Button,
  ButtonToolbar,
  ButtonGroup,
  Dropdown,
  Navbar,
  Nav,
} from 'react-bootstrap'

import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import { MzdGlobalContext } from './../lib/global'

import { smugler } from './../smugler/api'

import { HoverTooltip } from './../lib/tooltip'
import { goto, compass } from './../lib/route.jsx'

import { jcss } from '../util/jcss'

import kUserDefaultPic from './../auth/img/user-default-pic.png'

import NewImg from './../img/new-button.png'
import UploadImg from './../img/upload.png'

import { SearchForm } from './SearchForm'

class UserPic extends React.Component {
  constructor(props) {
    super(props)
    this.cancelToken = smugler.makeCancelToken()
    this.state = {
      name: 'user',
      email: 'email',
    }
  }

  componentDidMount() {
    smugler.getAuth({ cancelToken: this.cancelToken.token }).then((res) => {
      if (res) {
        this.setState({
          name: res.data.name,
          email: res.data.email,
        })
      }
    })
  }

  componentWillUnmount() {
    this.cancelToken.cancel()
  }

  render() {
    // TODO: use custom user uploaded picture for userpic here
    return (
      <div className={jcss(styles.user_pic, 'd-inline-flex')}>
        <img
          src={kUserDefaultPic}
          className={styles.user_pic_image}
          alt={'user'}
        />
        <div className="d-none d-sm-none d-md-block">
          &nbsp;
          {this.state.name}
        </div>
      </div>
    )
  }
}

class PrivateNavButtonsImpl extends React.Component {
  constructor(props) {
    super(props)
    this.newNodeCancelToken = smugler.makeCancelToken()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
  }

  handleNewClick = (event) => {
    smugler.node
      .create({
        cancelToken: this.newNodeCancelToken.token,
      })
      .then((node) => {
        if (node) {
          goto.node({ history: this.props.history, nid: node.nid })
        }
      })
  }

  getAuxGroup = () => {
    const { aux } = this.context.topbar // .aux;
    if (!aux) {
      return null
    }
    const auxBtns = Object.values(aux)
    return (
      <ButtonToolbar className={styles.creation_toolbar}>
        {auxBtns}
      </ButtonToolbar>
    )
  }

  render() {
    const { query } = compass.search.get({ location: this.props.location })
    const userpic = <UserPic />
    return (
      <>
        <SearchForm from={query} className={styles.search_form} />

        <ButtonToolbar className={styles.creation_toolbar}>
          <Button
            variant="light"
            as={Link}
            to="/upload-file"
            className={styles.nav_button}
          >
            <HoverTooltip tooltip={'Upload'}>
              <img
                src={UploadImg}
                className={styles.new_btn_img}
                alt="Upload from file"
              />
            </HoverTooltip>
          </Button>
          <Button
            variant="light"
            onClick={this.handleNewClick}
            className={styles.nav_button}
          >
            <HoverTooltip tooltip={'New'}>
              <img src={NewImg} className={styles.new_btn_img} alt="New" />
            </HoverTooltip>
          </Button>
        </ButtonToolbar>

        {this.getAuxGroup()}

        <Dropdown
          className={jcss(styles.account_dropdown)}
          as={ButtonGroup}
          navbar
        >
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
}

PrivateNavButtonsImpl.contextType = MzdGlobalContext
const PrivateNavButtons = withRouter(PrivateNavButtonsImpl)

class PublicNavButtons extends React.Component {
  render() {
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
}

function GlobalNavBar() {
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  if (account == null) {
    return <></>
  }
  let buttons
  if (account.isAuthenticated()) {
    buttons = <PrivateNavButtons />
  } else {
    buttons = <PublicNavButtons />
  }
  return (
    <>
      <Navbar className={styles.navbar}>
        <Navbar.Brand as={Link} to="/" className={jcss(styles.brand)}>
          <span role="img" aria-label="next">
            &#x1F9F5;
          </span>
          <div className="d-none d-sm-none d-md-block"> Mazed </div>
        </Navbar.Brand>
        {buttons}
      </Navbar>
      <div className={styles.navbar_filler} />
    </>
  )
}

export default withRouter(GlobalNavBar)
