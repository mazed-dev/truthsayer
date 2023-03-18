/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import { authentication } from 'smuggler-api'
import { goto } from '../lib/route'
import { LoginForm, Spinner } from 'elementary'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'

const LoginCardBox = styled.div`
  border: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  height: 80vh;
`

const TruthsayerLoginForm = styled(LoginForm)`
  margin-top: 22px;
`
const ErrorBox = styled.div`
  color: red;
`

class Login extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      email: this.props.email,
      password: '',
      isReady: false,
      server_error: null,
      isLoading: false,
    }
    this.emailRef = React.createRef()
    this.createSessionAbortController = new AbortController()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  componentWillUnmount() {
    this.createSessionAbortController.abort()
  }

  onSubmit = (email, password) => {
    this.setState({ server_error: null, isLoading: true })
    const permissions = null
    authentication.session
      .create(
        {
          email,
          password,
          permissions,
        },
        this.createSessionAbortController.signal
      )
      .catch(this.handleSubmitError)
      .then(() => {
        FromTruthsayer.sendMessage({
          type: 'CHECK_AUTHORISATION_STATUS_REQUEST',
        })
          .then(() =>
            // Redirect to default on success and failure, because Archaeologist
            // might be not yet installed
            goto.default({})
          )
          .catch(() => goto.default({}))
        // { history: this.props.history });
      })
  }

  handleSubmitError = (err) => {
    // *dbg*/ console.log('Server error ', err)
    if (err && err.response) {
      // if (err.response.status === HttpStatus.FORBIDDEN) {
      if (err.response.data && err.response.data.message) {
        this.setState({
          server_error: err.response.data.message,
        })
      } else {
        this.setState({
          server_error: err.response.stringify(),
        })
      }
    } else {
      this.setState({
        server_error: 'Server error',
      })
    }
    goto.notice.error({ history: this.props.history })
  }

  render() {
    const { isLoading } = this.state
    return (
      <LoginCardBox>
        <TruthsayerLoginForm onSubmit={this.onSubmit} disabled={isLoading} />
        <ErrorBox>{this.state.server_error}</ErrorBox>
        {isLoading === true ? <Spinner.Wheel /> : null}
      </LoginCardBox>
    )
  }
}

Login.defaultProps = {
  email: '',
}

export default withRouter(Login)
