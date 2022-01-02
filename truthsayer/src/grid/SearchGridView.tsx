/** @jsxImportSource @emotion/react */

import styled from '@emotion/styled'
import { useLocation } from 'react-router-dom'
import { parse } from 'query-string'

import { SearchGrid } from './SearchGrid'
import { CreateNewNodeMenu } from './CreateNewNodeMenu'

const Box = styled.div`
  width: 100%;
  max-width: 100%;
`

export const SearchGridView = ({}: {}) => {
  const location = useLocation()
  const params = parse(location.search)
  return (
    <Box>
      <SearchGrid q={params.q} defaultSearch />
      <CreateNewNodeMenu />
    </Box>
  )
}
