import React from 'react'

import { Card, Button, Container } from 'react-bootstrap'
import { withRouter } from 'react-router-dom'

class WaitingForApproval extends React.Component {
  constructor(props) {
    super(props)
    this.username =
      this.props.location.state && this.props.location.state.username
        ? this.props.location.state.username
        : 'customer'
  }

  handleBack = () => {
    this.props.history.push('/')
  }

  render() {
    // Have a beatiful day and see you soon!
    return (
      <Container>
        <Card className="border-0 p-4">
          <Card.Body className="p-3">
            <Card.Title>Submited!</Card.Title>
            <Card.Text>Dear {this.username},</Card.Text>
            <Card.Text>
              we are happy to inform you, that we received your request to sign
              in. Registration is not fully open yet, because Mazed is still on
              early stages of development. We will carefully consider your
              request and will get back to you as soon as possible.
            </Card.Text>
            <Card.Text>
              Thank you very much indeed for your interest in Mazed!
            </Card.Text>
            <Card.Text>Sincerely yours,</Card.Text>
            <Card.Text>Mazed team</Card.Text>
          </Card.Body>
          <Button variant="outline-secondary" onClick={this.handleBack}>
            Back to main page
          </Button>
        </Card>
      </Container>
    )
  }
}

export default withRouter(WaitingForApproval)
