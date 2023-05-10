import React from 'react'

import { goto } from '../lib/route'
import { authCookie, authentication } from 'smuggler-api'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'

export class Logout extends React.Component {
  constructor(props) {
    super(props)
    this.fetchAbortController = new AbortController()
  }

  componentWillUnmount() {
    this.fetchAbortController.abort()
  }

  componentDidMount() {
    if (this.context.account != null) {
      authentication.session
        .delete({
          signal: this.fetchAbortController.signal,
        })
        .then((res) => {
          if (res != null) {
            authCookie.veil.drop()
            // For some reason proper redirect with history doesn't work here
            FromTruthsayer.sendMessage({
              type: 'CHECK_AUTHORISATION_STATUS_REQUEST',
            })
            goto.notice.seeYou({})
          } else {
            goto.notice.error({})
          }
        })
    } else {
      goto.default({})
    }
  }

  render() {
    return <h3>Logout...</h3>
  }
}
