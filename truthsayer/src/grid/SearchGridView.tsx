/** @jsxImportSource @emotion/react */
import React from 'react'
import styled from '@emotion/styled'
import { useLocation, useHistory } from 'react-router-dom'
import { parse } from 'query-string'

import { SearchGrid } from './SearchGrid'
import { CreateNewNodeMenu } from './CreateNewNodeMenu'
import { ArchaeologistState } from '../apps-list/archaeologistState'
import { goto } from '../lib/route'

import lodash from 'lodash'

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
  }, [archaeologistState, history])
  return (
    <Box>
      <SearchGrid q={queryStr} defaultSearch />
      <CreateNewNodeMenu />
    </Box>
  )
}
