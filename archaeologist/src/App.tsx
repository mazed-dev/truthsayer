/** @jsxImportSource @emotion/react */

import React from 'react'
import {SaveButton} from './components/Button/Button'
import * as log from './util/log'

import styled from '@emotion/styled'
import {css} from '@emotion/react'

const AppContainer = styled.div`
  osition: relative;
  width: 280px;
  height: 280px;
`
export const App = () => {
  const [authenticated, setAuthenticated] = React.useState(false)
  log.debug('Render app', authenticated)
  return (
    <AppContainer>
      <SaveButton />
      <div
        css={{
          color: 'darkorchid',
          '& .name': {
            color: 'orange'
          }
        }}
      >
        This is darkorchid.
              <div className="name">This is orange</div>

      </div>
    </AppContainer>
  )
}

export default App
