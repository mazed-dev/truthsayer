/** @jsxImportSource @emotion/react */

import React, { useContext, useRef } from 'react'

import styled from '@emotion/styled'

import { Dropdown } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import { MdiAdd, MdiFileUpload, StyleButtonCreate, TDoc } from 'elementary'

import { MimeType } from 'armoury'
import { goto } from './../lib/route'
import { UploadFileAsNodeForm } from '../upload/UploadNodeButton'
import MzdGlobalContext from '../lib/global'

const CreateNodeBigIcon = styled(MdiAdd)`
  font-size: 32px !important;
`

const kShadow = '0px 1px 2px 1px rgba(0, 0, 0, 0.2)'
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

const CreateNewNodeMenuFixed = styled.div`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1024;
`

const CustomDropdownToggle = styled(Dropdown.Toggle)`
  font-size: 0;
  border-radius: 42px;
  padding: 6px;
  box-shadow: ${kShadow};
  border-width: 0;
  &:after {
    display: none;
  }
  &:focus {
    box-shadow: 0 0 0 0.25rem #54a3ff80 !important;
  }
  ${StyleButtonCreate}
`

const CustomDropdownMenu = styled(Dropdown.Menu)({
  backgroundColor: 'transparent',
  border: 'none',
  padding: '4px 0 4px 0',
})

const CustomDropdownItem = styled(Dropdown.Item)`
  padding: 12px 12px 12px 12px;
  margin: 8px 12px 8px 12px;
  box-shadow: ${kShadow};
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 32px;
  &:focus {
    box-shadow: 0 0 0 0.25rem #54a3ff80 !important;
  }
  ${StyleButtonCreate}
  background-image: none;
  background-color: white;
  color: inherit;
`

export const CreateNewNodeMenu = () => {
  const history = useHistory()
  const ctx = useContext(MzdGlobalContext)
  const newNodeClick = () => {
    const doc = TDoc.makeEmpty()
    ctx.storage.node
      .create({
        text: doc.toNodeTextData(),
        extattrs: {
          content_type: MimeType.TEXT_PLAIN,
        },
        created_via: { manualAction: null },
      })
      .then((node) => {
        if (node) {
          goto.node({ history: history, nid: node.nid })
        }
      })
  }
  const uploadFileFormRef = useRef<HTMLInputElement>(null)
  const uploadNodeClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    event.preventDefault()
    const { current } = uploadFileFormRef
    if (current) {
      current.click()
    }
  }

  return (
    <CreateNewNodeMenuFixed>
      <Dropdown>
        <CustomDropdownToggle variant="success" id="dropdown-basic">
          <CreateNodeBigIcon />
        </CustomDropdownToggle>
        <CustomDropdownMenu>
          <CustomDropdownItem onClick={uploadNodeClick}>
            <UploadNodeFromFileIcon />
            <DropdownItemText>Upload file</DropdownItemText>
          </CustomDropdownItem>
          <CustomDropdownItem onClick={newNodeClick}>
            <CreateNodeIcon />
            <DropdownItemText>Create new</DropdownItemText>
          </CustomDropdownItem>
        </CustomDropdownMenu>
      </Dropdown>
      <UploadFileAsNodeForm ref={uploadFileFormRef} />
    </CreateNewNodeMenuFixed>
  )
}
