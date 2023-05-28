import { log } from 'armoury'
import React, { useEffect, useRef, useContext } from 'react'

import { authCookie, authentication } from 'smuggler-api'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'

import { MzdGlobalContext } from '../lib/global'
import { goto } from '../lib/route'

export const Logout = () => {
  const ctx = useContext(MzdGlobalContext)
  const abortControllerRef = useRef(new AbortController())

  useEffect(() => {
    const ref = abortControllerRef
    return () => {
      ref.current.abort()
    }
  }, [])

  useEffect(() => {
    if (ctx.account == null) {
      goto.default({})
    } else {
      authentication.session
        .delete({
          signal: abortControllerRef.current.signal,
        })
        .then(
          (res) => {
            if (res != null) {
              authCookie.veil.drop()
              FromTruthsayer.sendMessage({
                type: 'CHECK_AUTHORISATION_STATUS_REQUEST',
              }).catch((reason) =>
                log.error(`Failed to check auth status: ${reason}`)
              )
              goto.notice.seeYou({})
            } else {
              goto.notice.error({})
            }
          },
          () => goto.notice.error({})
        )
    }
  }, [ctx.account])

  return <h3>Logout...</h3>
}
