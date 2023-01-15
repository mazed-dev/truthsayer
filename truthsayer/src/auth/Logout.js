import React from 'react'

import PropTypes from 'prop-types'

import { withRouter } from 'react-router-dom'
import { goto } from '../lib/route'
import { authentication } from 'smuggler-api'

import { MzdGlobalContext } from './../lib/global'

class Logout extends React.Component {
  constructor(props) {
    super(props)
    this.fetchAbortController = new AbortController()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  componentWillUnmount() {
    this.fetchAbortController.abort()
  }

  componentDidMount() {
    const account = this.context.account
    const isAuthenticated = account != null && account.isAuthenticated()
    if (isAuthenticated) {
      authentication.session
        .delete({
          signal: this.fetchAbortController.signal,
        })
        .catch(this.handleError)
        .then((res) => {
          if (res != null) {
            // for some reason proper redirect with history doesn't work here
            goto.notice.seeYou({})
          } else {
            goto.notice.error({})
          }
        })
    } else {
      goto.default({})
    }
  }

  handleError = (error) => {
    // *dbg*/ console.log('Logout.handleError', error)
    // goto.notice.error({ history: this.props.history });
  }

  render() {
    return <h3>Logout...</h3>
  }
}

Logout.contextType = MzdGlobalContext

export default withRouter(Logout)
