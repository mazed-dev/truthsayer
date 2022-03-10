/** @jsxImportSource @emotion/react */

import React, { useContext, useState, useRef } from 'react'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { Dropdown } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import { MzdGlobalContext, MzdGlobalContextProps } from '../lib/global'
import { goto, History } from '../lib/route'

import { smuggler, NewNodeResponse } from 'smuggler-api'
import { TDoc } from '../doc/doc_util'
import { TNode } from 'smuggler-api'

import { UploadFileAsNodeForm } from '../upload/UploadNodeButton'
import {
  MdiAdd,
  MdiContentCopy,
  MdiFileUpload,
  MdiSearch,
  StyleButtonWhite,
  SmallCard,
} from 'elementary'
import { Optional } from 'armoury'
import { log } from 'armoury'
import { isAbortError } from 'armoury'

import { SearchAndConnectJinn } from './SearchAndConnect'

export type ChainActionBarSide = 'left' | 'right'

async function cloneNode({
  from,
  to,
  abortSignal,
  isBlank = false,
}: {
  from?: string
  to?: string
  abortSignal?: AbortSignal
  isBlank?: boolean
}): Promise<Optional<NewNodeResponse>> {
  const nid: Optional<string> = from ? from : to ? to : null
  if (!nid) {
    return null
  }
  const node: Optional<TNode> = await smuggler.node
    .get({
      nid,
      signal: abortSignal,
    })
    .catch((err) => {
      if (isAbortError(err)) {
        return null
      }
      log.exception(err)
      return null
    })
  if (!node) {
    return null
  }
  let doc = await TDoc.fromNodeTextData(node.getText())
  doc = doc.makeACopy(node.getNid(), isBlank || false)
  try {
    return await smuggler.node.create({
      text: doc.toNodeTextData(),
      signal: abortSignal,
      from_nid: from,
      to_nid: to,
    })
  } catch (err) {
    if (isAbortError(err)) {
      return null
    }
    log.exception(err)
  }
  return null
}

class ChainActionHandler {
  nid: string
  nidIsPrivate: boolean
  abortSignal?: AbortSignal
  history: History

  constructor({
    nid,
    nidIsPrivate,
    history,
    abortSignal,
  }: {
    nid: string
    nidIsPrivate: boolean
    abortSignal?: AbortSignal
    history: History
  }) {
    this.nid = nid
    this.nidIsPrivate = nidIsPrivate
    this.abortSignal = abortSignal
    this.history = history
  }

  logInNeeded = (context: MzdGlobalContextProps): boolean => {
    return this.nidIsPrivate && !context.account
  }

  handleNext = (context: MzdGlobalContextProps, side: ChainActionBarSide) => {
    if (this.logInNeeded(context)) {
      goto.notice.logInToContinue({ history: this.history })
      return
    }
    smuggler.node
      .create({
        text: TDoc.makeEmpty().toNodeTextData(),
        signal: this.abortSignal,
        from_nid: side === 'right' ? this.nid : undefined,
        to_nid: side === 'left' ? this.nid : undefined,
      })
      .then((node) => {
        if (node) {
          const { nid } = node
          goto.node({ history: this.history, nid })
        }
      })
  }

  handleNextClone = (
    context: MzdGlobalContextProps,
    side: ChainActionBarSide
  ) => {
    if (this.logInNeeded(context)) {
      goto.notice.logInToContinue({ history: this.history })
      return
    }
    cloneNode({
      from: side === 'right' ? this.nid : undefined,
      to: side === 'left' ? this.nid : undefined,
      abortSignal: this.abortSignal,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.history, nid })
      }
    })
  }
}

const CreateNodeBigIcon = styled(MdiAdd)({
  fontSize: '24px',
})

const CustomDropdownToggle = styled(Dropdown.Toggle)({
  fontSize: 0,
  borderRadius: '42px',
  padding: '6px',
  borderWidth: 0,
  '&:after': {
    // Hide dropdown arrow
    display: 'none',
  },
  ...StyleButtonWhite,
})

const CustomDropdownMenu = styled(Dropdown.Menu)({
  border: '1px solid rgba(0,0,0,.15)',
  borderRadius: '6px',
  padding: '4px 0 4px 0',
})

const CustomDropdownItem = styled(Dropdown.Item)({
  backgroundColor: 'white',
  padding: '8px 8px 8px 8px',
  margin: '0 10px 0 0',
  '&:active': {
    backgroundColor: '#008000',
    boxShadow: '0 0 0 .25rem rgba(60,153,110,.5)',
    border: 'none',
  },
})

const DropdownItemText = styled.span`
  font-size: 14px;
  display: inline-block;
  vertical-align: middle;
  padding-left: 12px;
`

const CustomDropdown = styled(Dropdown)({
  marginRight: 'auto',
  marginLeft: 'auto',
  padding: '2px 0 2px 0',
  width: '36px',
})

export const ChainActionBar = ({
  side,
  nid,
  nidIsPrivate,
  abortSignal,
  addRef,
  className,
}: {
  side: ChainActionBarSide
  nid: string
  nidIsPrivate: boolean
  abortSignal?: AbortSignal
  addRef: ({ from, to }: { from: string; to: string }) => void
  className?: string
}) => {
  const history = useHistory()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const handler = new ChainActionHandler({
    nid,
    nidIsPrivate,
    abortSignal,
    history,
  })
  const uploadFileFormRef = useRef<HTMLInputElement>(null)
  const ctx = useContext(MzdGlobalContext)
  return (
    <SmallCard
      className={className}
      css={css`
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.28);
        border-style: dashed;
        box-shadow: none;
      `}
    >
      <CustomDropdown>
        <CustomDropdownToggle variant="success" id="dropdown-basic">
          <CreateNodeBigIcon />
        </CustomDropdownToggle>
        <CustomDropdownMenu>
          <CustomDropdownItem onClick={() => handler.handleNext(ctx, side)}>
            <MdiAdd css={{ verticalAlign: 'middle' }} />
            <DropdownItemText>Create new and link</DropdownItemText>
          </CustomDropdownItem>
          <CustomDropdownItem
            onClick={() => handler.handleNextClone(ctx, side)}
          >
            <MdiContentCopy css={{ verticalAlign: 'middle' }} />
            <DropdownItemText>Copy and link</DropdownItemText>
          </CustomDropdownItem>
          <CustomDropdownItem
            onClick={(e) => {
              e.preventDefault()
              const { current } = uploadFileFormRef
              if (current) {
                current.click()
              }
            }}
          >
            <MdiFileUpload css={{ verticalAlign: 'middle' }} />
            <DropdownItemText>Upload file and link</DropdownItemText>
          </CustomDropdownItem>
          <CustomDropdownItem onClick={() => setShowSearchModal(true)}>
            <MdiSearch css={{ verticalAlign: 'middle' }} />
            <DropdownItemText>Find and link to the {side}</DropdownItemText>
          </CustomDropdownItem>
        </CustomDropdownMenu>
      </CustomDropdown>
      <UploadFileAsNodeForm
        from_nid={side === 'right' ? nid : undefined}
        to_nid={side === 'left' ? nid : undefined}
        ref={uploadFileFormRef}
      />
      <SearchAndConnectJinn
        nid={nid}
        addRef={addRef}
        show={showSearchModal}
        left={side === 'left'}
        setShow={setShowSearchModal}
      />
    </SmallCard>
  )
}
