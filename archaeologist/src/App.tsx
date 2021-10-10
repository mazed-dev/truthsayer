import React from 'react'
import { SaveButton } from './components/Button/Button'
import * as log from './util/log'

export const App = () => {
  log.debug('Render app')
  return (
    <>
      <SaveButton />
    </>
  )
}

export default App
