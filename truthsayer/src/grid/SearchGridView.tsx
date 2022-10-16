/** @jsxImportSource @emotion/react */
import React from 'react'
import styled from '@emotion/styled'
import { useLocation } from 'react-router-dom'
import { parse } from 'query-string'

import { SearchGrid } from 'elementary'
import { CreateNewNodeMenu } from './CreateNewNodeMenu'

import lodash from 'lodash'

const Box = styled.div`
  width: 100%;
  max-width: 100%;
`

export const SearchGridView = () => {
  const location = useLocation()
  const params = parse(location.search)
  let { q } = params
  let queryStr: null | string = null
  if (lodash.isArray(q)) {
    queryStr = q.join(' ')
  } else {
    queryStr = q
  }
  return (
    <Box>
      <SearchGrid q={queryStr} defaultSearch />
      <CreateNewNodeMenu />
    </Box>
  )
}
