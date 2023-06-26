/** @jsxImportSource @emotion/react */

import { useContext } from 'react'
import styled from '@emotion/styled'

import { useNavigate } from 'react-router-dom'

import { TNode } from 'smuggler-api'
import { MdiDelete } from 'elementary'
import { log } from 'armoury'

import { MzdGlobalContext } from '../lib/global'
import { NotificationToast } from '../lib/Toaster'
import { goto } from '../lib/route'
import {
  FootbarDropdown,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggleMeatballs,
} from './Footbar'

const IconDelete = styled(MdiDelete)`
  vertical-align: middle;
  padding: 0 12px 2px 0;
`
const Box = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`

const Dropdown = styled(FootbarDropdown)`
  margin-left: auto;
  margin-right: auto;
`
const DropdownItem = styled(FootbarDropdownItem)`
  padding-left: 0.2rem;
  padding-right: 0.8rem;
`
export function FullCardFootbar({ node }: { node: TNode | null }) {
  const navigate = useNavigate()
  const ctx = useContext(MzdGlobalContext)
  if (node == null) {
    return null
  }
  const { nid } = node
  const handleDeleteNote = () => {
    const toaster = ctx.toaster
    ctx.storage.node.delete({ nid }).then(
      () => {
        toaster.push(
          <NotificationToast
            title={'Deleted'}
            message={'Node has been deleted'}
            key={nid}
          />
        )
        goto.default({ navigate: navigate })
      },
      (reason) => log.error(`Failed to delete node: ${reason}`)
    )
  }
  return (
    <Box>
      <Dropdown>
        <FootbarDropdownToggleMeatballs id={'more-options-for-fullsize-card'} />
        <FootbarDropdownMenu>
          <DropdownItem onClick={handleDeleteNote}>
            <IconDelete />
            Delete
          </DropdownItem>
        </FootbarDropdownMenu>
      </Dropdown>
    </Box>
  )
}
