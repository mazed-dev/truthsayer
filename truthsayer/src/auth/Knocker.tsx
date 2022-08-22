import React from 'react'

import { Knocker as KnockerEngine, authCookie } from 'smuggler-api'
import { log } from 'armoury'

type KnockerProps = {}
export function KnockerElement({}: KnockerProps) {
  React.useEffect(() => {
    const knocker = new KnockerEngine(374321, () => {
      authCookie.drop()
    })
    knocker.start()
    return () => knocker.abort()
  }, [])
  return <></>
}
