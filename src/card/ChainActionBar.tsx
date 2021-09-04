import React, { useContext, useState } from 'react'

import { ButtonGroup, Row } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'
import { History } from 'history'
import { CancelToken } from 'axios'

import { ImgButton } from '../lib/ImgButton'
import { HoverTooltip } from '../lib/tooltip'
import UploadImg from '../img/upload-strip.svg'
import { MzdGlobalContext, MzdGlobalContextProps } from '../lib/global'
import { goto } from '../lib/route.jsx'

import { smugler, NewNodeResponse } from '../smugler/api'
import { makeACopy } from '../doc/doc_util'
import { TNode } from '../smugler/types'

import NextNewRightImg from './../img/next-link-right-00001.png'
import NextNewLeftImg from './../img/next-link-left-00001.png'
import SearchImg from './../img/search.png'
import { UploadNodeButton } from '../upload/UploadNodeButton'
import NextCopyLeftImg from './../img/next-clone-left.png'
import NextCopyRightImg from './../img/next-clone-right.png'
import { LocalCrypto } from '../crypto/local'
import { Optional } from '../util/types'
import { jcss } from './../util/jcss'
import { SearchAndConnectJinn } from './SearchAndConnect'

import {
  FootbarDropdown,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggleMeatballs,
} from './Footbar'

export type ChainActionBarSide = 'left' | 'right' | 'both'

async function cloneNode({
  from,
  to,
  crypto,
  cancelToken,
  isBlank = false,
}: {
  from?: string
  to?: string
  crypto?: LocalCrypto
  cancelToken: CancelToken
  isBlank?: boolean
}): Promise<Optional<NewNodeResponse>> {
  const nid: Optional<string> = from ? from : to ? to : null
  if (!nid) {
    return null
  }
  const node: Optional<TNode> = await smugler.node.get({
    nid,
    crypto,
    cancelToken,
  })
  if (!node) {
    return null
  }
  const doc = await makeACopy(node.getData(), node.getNid(), isBlank || false)
  return await smugler.node.create({
    doc,
    cancelToken,
    from_nid: from,
    to_nid: to,
  })
}

class ChainActionHandler {
  nid: string
  nidIsPrivate: boolean
  cancelToken: CancelToken
  history: History

  constructor({
    nid,
    nidIsPrivate,
    history,
    cancelToken,
  }: {
    nid: string
    nidIsPrivate: boolean
    cancelToken: CancelToken
    history: History
  }) {
    this.nid = nid
    this.nidIsPrivate = nidIsPrivate
    this.cancelToken = cancelToken
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
    smugler.node
      .create({
        cancelToken: this.cancelToken,
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
      crypto: context.account?.getLocalCrypto(),
      cancelToken: this.cancelToken,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.history, nid })
      }
    })
  }
}

const ChainActionBarImpl = ({
  side,
  nid,
  nidIsPrivate,
  cancelToken,
  addRef,
}: {
  side: 'right' | 'left'
  nid: string
  nidIsPrivate: boolean
  cancelToken: CancelToken
  addRef: ({ from, to }: { from: string; to: string }) => void
}) => {
  const history = useHistory()
  const ctx = useContext(MzdGlobalContext)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const handler = new ChainActionHandler({
    nid,
    nidIsPrivate,
    cancelToken,
    history,
  })

  return (
    <div>
      <ButtonGroup>
        <HoverTooltip tooltip={`Create new & link to the ${side}`}>
          <ImgButton
            className="test"
            onClick={() => handler.handleNext(ctx, side)}
            is_disabled={false}
          >
            <img
              src={side === 'right' ? NextNewRightImg : NextNewLeftImg}
              // className={styles.tool_button_img}
              // alt="Link to the right"
            />
          </ImgButton>
        </HoverTooltip>

        <FootbarDropdown>
          <FootbarDropdownToggleMeatballs
            id={'more-options-for-chain-actions'}
          />

          <FootbarDropdownMenu>
            <FootbarDropdownItem
              // className={styles.dropdown_menu_item}
              className="test"
              onClick={() => handler.handleNextClone(ctx, side)}
            >
              <img
                src={side === 'right' ? NextCopyRightImg : NextCopyLeftImg}
                // className={styles.tool_button_img}
                // alt="Link to the right"
              />
              {`Copy & link to the ${side}`}
            </FootbarDropdownItem>
            <UploadNodeButton
              className="test"
              // className={styles.dropdown_menu_item}
              as={FootbarDropdownItem}
              from_nid={side === 'right' ? nid : null}
              to_nid={side === 'left' ? nid : null}
            >
              <img
                src={UploadImg}
                className="test"
                // className={styles.dropdown_menu_inline_img}
                alt="Upload from file"
              />
              Upload
            </UploadNodeButton>
            <FootbarDropdownItem
              // className={styles.dropdown_menu_item}
              onClick={() => setShowSearchModal(true)}
            >
              <img
                src={SearchImg}
                // className={styles.tool_button_img}
                // alt="Link to the right"
              />
              {`Find & link to the ${side}`}
            </FootbarDropdownItem>
          </FootbarDropdownMenu>
        </FootbarDropdown>
      </ButtonGroup>
      <SearchAndConnectJinn
        nid={nid}
        addRef={addRef}
        show={showSearchModal}
        left={side === 'left'}
        setShow={setShowSearchModal}
      />
    </div>
  )
}

export const ChainActionBar = ({
  side,
  nid,
  nidIsPrivate,
  cancelToken,
  addRef,
}: {
  side: ChainActionBarSide
  nid: string
  nidIsPrivate: boolean
  cancelToken: CancelToken
  addRef: ({ from, to }: { from: string; to: string }) => void
}) => {
  if (side === 'both') {
    return (
      <Row
        className={jcss('d-flex', 'justify-content-center' /* styles.row */)}
      >
        <ChainActionBarImpl
          side="left"
          nid={nid}
          nidIsPrivate={nidIsPrivate}
          cancelToken={cancelToken}
          addRef={addRef}
        />
        <ChainActionBarImpl
          side="right"
          nid={nid}
          nidIsPrivate={nidIsPrivate}
          cancelToken={cancelToken}
          addRef={addRef}
        />
      </Row>
    )
  }
  return (
    <ChainActionBarImpl
      side={side}
      nid={nid}
      nidIsPrivate={nidIsPrivate}
      cancelToken={cancelToken}
      addRef={addRef}
    />
  )
}
