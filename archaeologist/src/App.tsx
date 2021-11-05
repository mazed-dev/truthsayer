import React from 'react'
import { SaveButton } from './components/Button/Button'
import * as log from './util/log'

import { authCookie } from 'smuggler-api'

export const App = () => {
  const [authenticated, setAuthenticated] = React.useState(false)
  log.debug('Render app', authenticated)
  return (
    <>
      <SaveButton />
    </>
  )
}

export default App
