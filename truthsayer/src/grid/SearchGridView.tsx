/** @jsxImportSource @emotion/react */
import React, { useContext } from 'react'
import styled from '@emotion/styled'
import { useLocation, useHistory } from 'react-router-dom'
import { parse } from 'query-string'

import { SearchGrid } from 'elementary'
import { CreateNewNodeMenu } from './CreateNewNodeMenu'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import { goto } from '../lib/route'

import lodash from 'lodash'
import MzdGlobalContext from '../lib/global'
import { accountConfig } from '../account/config'

const Box = styled.div`
  width: 100%;
  max-width: 100%;
`

export const SearchGridView = ({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}) => {
  const loc = useLocation()
  const history = useHistory()
  const ctx = useContext(MzdGlobalContext)
  const params = parse(loc.search)
  let { q } = params
  let queryStr: null | string = null
  if (lodash.isArray(q)) {
    queryStr = q.join(' ')
  } else {
    queryStr = q
  }
  React.useEffect(() => {
    if (archaeologistState.state === 'not-installed') {
      goto.onboarding({ history })
    }
    // This is a dirty hack to check if user run onboarding yet by using flag
    // in account config. Onboarding process sets this to true on "Ready to go"
    // step. Ideally this code should look into the storage and run onboarding
    // proecess only if there are no nodes.
    const onboardingStatus = accountConfig.local.onboarding.get()
    if (onboardingStatus.invoked === false) {
      goto.onboarding({ history })
    }
  }, [archaeologistState, history])
  return (
    <Box>
      <SearchGrid q={queryStr} defaultSearch storage={ctx.storage} />
      <CreateNewNodeMenu />
    </Box>
  )
}
