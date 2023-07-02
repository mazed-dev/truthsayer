/** @jsxImportSource @emotion/react */
import React, { useContext } from 'react'
import styled from '@emotion/styled'
import { useLocation, useNavigate } from 'react-router-dom'
import { parse } from 'query-string'

import { SearchGrid } from './SearchGrid'
import { CreateNewNodeMenu } from './CreateNewNodeMenu'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import { goto } from '../lib/route'

import lodash from 'lodash'
import MzdGlobalContext from '../lib/global'

const Box = styled.div`
  width: 100%;
  max-width: 100%;
`

export const SearchGridView = ({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}) => {
  const ctx = useContext(MzdGlobalContext)
  const loc = useLocation()
  const navigate = useNavigate()
  const params = parse(loc.search)
  let { q } = params
  let queryStr: null | string = null
  if (lodash.isArray(q)) {
    queryStr = q.join(' ')
  } else {
    queryStr = q
  }
  React.useEffect(() => {
    if (ctx.account == null) {
      goto.signup({ navigate })
    } else if (archaeologistState.state === 'not-installed') {
      goto.onboarding({ navigate })
    }
  }, [archaeologistState, navigate, ctx])
  return (
    <Box>
      <SearchGrid q={queryStr} defaultSearch />
      <CreateNewNodeMenu />
    </Box>
  )
}
