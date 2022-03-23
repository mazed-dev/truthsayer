/** @jsxImportSource @emotion/react */

import React, { useRef } from 'react'

import styled from '@emotion/styled'

import { Dropdown } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import { MdiAdd, MdiFileUpload, StyleButtonCreate, TDoc } from 'elementary'

import { smuggler } from 'smuggler-api'
import { goto } from './../lib/route'
import { UploadFileAsNodeForm } from '../upload/UploadNodeButton'

const CreateNodeBigIcon = styled(MdiAdd)`
  font-size: 46px;
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

const CustomDropdownToggle = styled(Dropdown.Toggle)({
  fontSize: 0,
  borderRadius: '42px',
  padding: '6px',
  boxShadow: kShadow,
  borderWidth: 0,
  '&:after': {
    // Hide dropdown arrow
    display: 'none',
  },
  ...StyleButtonCreate,
})

const CustomDropdownMenu = styled(Dropdown.Menu)({
  backgroundColor: 'transparent',
  border: 'none',
  padding: '4px 0 4px 0',
})

const CustomDropdownItem = styled(Dropdown.Item)({
  backgroundColor: 'white',
  padding: '12px 12px 12px 12px',
  margin: '8px 12px 8px 12px',
  boxShadow: kShadow,
  border: '1px solid rgba(0,0,0,.15)',
  borderRadius: '32px',
  '&:active': {
    backgroundColor: '#008000',
    boxShadow: '0 0 0 .25rem rgba(60,153,110,.5)',
    border: 'none',
  },
})

export const CreateNewNodeMenu = () => {
  const history = useHistory()
  const newNodeClick = () => {
    const doc = TDoc.makeEmpty()
    smuggler.node
      .create({
        text: doc.toNodeTextData(),
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
