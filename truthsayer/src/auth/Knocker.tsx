import { log } from 'armoury'
import React from 'react'

import { Knocker as KnockerEngine, authCookie } from 'smuggler-api'

export function KnockerElement() {
  React.useEffect(() => {
    const knocker = new KnockerEngine(() => {
      authCookie.veil.drop()
    })
    knocker
      .start({})
      .catch((reason) => log.error(`Failed to start knocker: ${reason}`))
    return () => {
      knocker.stop()
    }
  }, [])
  return <></>
}
