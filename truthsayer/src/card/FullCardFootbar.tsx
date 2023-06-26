/** @jsxImportSource @emotion/react */

import { useContext } from 'react'
import styled from '@emotion/styled'

import { useNavigate } from 'react-router-dom'

import { TNode } from 'smuggler-api'
import { jcss, MdiArchive, MdiDelete } from 'elementary'

import styles from './FullCardFootbar.module.css'

import { MzdGlobalContext } from '../lib/global'
import { NotificationToast } from '../lib/Toaster'
import { goto } from '../lib/route'

import {
  FootbarDropdown,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggleMeatballs,
} from './Footbar'
import { log } from 'armoury'

const IconDelete = styled(MdiDelete)`
  vertical-align: middle;
  padding: 0 12px 2px 0;
`
const IconArchive = styled(MdiArchive)`
  vertical-align: middle;
  padding: 0 12px 2px 0;
`

const Box = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`
export function FullCardFootbar({ node }: { node: TNode | null }) {
  const navigate = useNavigate()
  const ctx = useContext(MzdGlobalContext)
  if (node == null) {
    return null
  }
  const { nid } = node
  const handleArchiveDoc = () => {
    const toaster = ctx.toaster
    toaster.push(
      <NotificationToast
        title={'Not yet implemented'}
        message={'Archive feature is not yet implemented'}
        key={nid}
      />
    )
  }

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
      <FootbarDropdown className={jcss(styles.toolbar_layout_item)}>
        <FootbarDropdownToggleMeatballs id={'more-options-for-fullsize-card'} />

        <FootbarDropdownMenu>
          <FootbarDropdownItem
            className={styles.dropdown_menu_item}
            onClick={handleDeleteNote}
          >
            <IconDelete />
            Delete
          </FootbarDropdownItem>
          <FootbarDropdownItem
            className={styles.dropdown_menu_item}
            onClick={handleArchiveDoc}
          >
            <IconArchive />
            Archive
          </FootbarDropdownItem>
        </FootbarDropdownMenu>
      </FootbarDropdown>
    </Box>
  )
}
