import React from 'react'

import { Form, InputGroup, Button, Container } from 'react-bootstrap'

import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import './WelcomePage.css'

class SignUpImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      email: '',
    }
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value })
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.history.push('/signup', {
      email: this.state.email,
    })
  }

  render() {
    return (
      <Form className="m-4" onSubmit={this.onSubmit}>
        <InputGroup className="w-50 m-4">
          <Form.Control
            type="email"
            value={this.state.email}
            onChange={this.handleEmailChange}
          />
          <Button variant="secondary" type="submit">
            Sign up
          </Button>
        </InputGroup>
      </Form>
    )
  }
}

const SignUp = withRouter(SignUpImpl)

function WelcomePage() {
  // <h3>Link up your ideas</h3>
  // <h3>Organize your knowledge</h3>
  // <h3>Line up your memories</h3>
  return (
    <Container>
      <Container className="mazed_title_block">
        <h1>Link up your ideas</h1>
        <h2 className="mazed_subtitle">
          they were here the whole time, all you need is a quick access
        </h2>
      </Container>
      <SignUp />
      <p />
    </Container>
  )
}

export default WelcomePage
