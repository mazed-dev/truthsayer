import React from 'react'

import { Knocker as KnockerEngine, authCookie } from 'smuggler-api'

export function KnockerElement() {
  React.useEffect(() => {
    const knocker = new KnockerEngine(() => {
      authCookie.veil.drop()
    })
    knocker.start({})
    return () => {
      knocker.abort()
    }
  }, [])
  return <></>
}
