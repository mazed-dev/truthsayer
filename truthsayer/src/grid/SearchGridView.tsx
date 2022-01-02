/** @jsxImportSource @emotion/react */

import { useLocation } from 'react-router-dom'

import { parse } from 'query-string'

import styled from '@emotion/styled'

import { Dropdown } from 'react-bootstrap'

import { MdiAdd, MdiFileUpload } from 'elementary'

import { SearchGrid } from './SearchGrid'

const Box = styled.div`
  width: 100%;
  max-width: 100%;
`

const CreateNodeBigIcon = styled(MdiAdd)`
  font-size: 48px;
`

const kDropdownItemIconSize = '32px'

const CreateNodeIcon = styled(MdiAdd)`
  font-size: ${kDropdownItemIconSize};
  vertical-align: middle;
`
const UploadNodeFromFileIcon = styled(MdiFileUpload)`
  font-size: ${kDropdownItemIconSize};
  vertical-align: middle;
`
const DropdownItemText = styled.span`
  font-size: 14px;
  display: inline-block;
  vertical-align: middle;
  padding-left: 12px;
`

const CreateNodeToolsFixed = styled.div`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1024;
`

export const CreateNodeTools = () => {
  return (
    <CreateNodeToolsFixed>
      <Dropdown>
        <Dropdown.Toggle
          variant="success"
          id="dropdown-basic"
          css={{
            fontSize: 0,
            borderRadius: '42px',
            padding: '6px',
            '&:after': { display: 'none' },
          }}
        >
          <CreateNodeBigIcon />
        </Dropdown.Toggle>
        <Dropdown.Menu
          css={{
            padding: '4px 0 4px 0',
          }}
        >
          <Dropdown.Item
            href="#/action-1"
            css={{
              padding: '8px 12px 8px 12px',
            }}
          >
            <CreateNodeIcon />
            <DropdownItemText>Create new</DropdownItemText>
          </Dropdown.Item>
          <Dropdown.Item
            href="#/action-2"
            css={{
              padding: '8px 12px 8px 12px',
            }}
          >
            <UploadNodeFromFileIcon />
            <DropdownItemText>Upload file</DropdownItemText>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </CreateNodeToolsFixed>
  )
}

export const SearchGridView = ({}: {}) => {
  const location = useLocation()
  const params = parse(location.search)
  return (
    <Box>
      <SearchGrid q={params.q} defaultSearch />
      <CreateNodeTools />
    </Box>
  )
}
