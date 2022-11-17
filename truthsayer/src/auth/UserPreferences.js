import React from 'react'
import { Link, withRouter } from 'react-router-dom'

import { Button, Container, Image } from 'react-bootstrap'

import user_default_pic from './img/user-default-pic.png'
import { productanalytics } from 'armoury'

class UserPreferences extends React.Component {
  render() {
    const name = this.props.account.getName()
    const email = this.props.account.getEmail()
    // TODO: use custom user uploaded picture for userpic here
    return (
      <Container>
        <div className="d-flex flex-column justify-content-right m-2">
          <h2>Account preferences</h2>
          <Image
            src={user_default_pic}
            roundedCircle
            fluid
            width="90"
            height="90"
            className="m-2"
          />
          <table className="m-2">
            <tbody>
              <tr>
                <td className="px-4 py-1">{'name'}</td>
                <td className={productanalytics.classExclude()}>{name}</td>
              </tr>
              <tr>
                <td className="px-4 py-1">{'email'}</td>
                <td className={productanalytics.classExclude()}>{email}</td>
              </tr>
              <tr className="py-1">
                <td className="px-4">{'password'}</td>
                <td className="">
                  <Link to="/password-recover-change">*******************</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Button variant="outline-secondary" as={Link} to="/" className="m-2">
          Go back
        </Button>
      </Container>
    )
  }
}

export default withRouter(UserPreferences)
