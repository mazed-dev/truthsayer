import React, { useContext, useState } from 'react'

import { ButtonToolbar } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'
import { CancelToken } from 'axios'

import { ImgButton } from '../lib/ImgButton'
import { HoverTooltip } from '../lib/tooltip'
import { MzdGlobalContext, MzdGlobalContextProps } from '../lib/global'
import { goto, History } from '../lib/route'
import { SmallCard } from './SmallCard'

import { smugler, NewNodeResponse } from '../smugler/api'
import { makeACopy } from '../doc/doc_util'
import { TNode } from '../smugler/types'

import { UploadNodeButton } from '../upload/UploadNodeButton'
import { LocalCrypto } from '../crypto/local'
import { Optional } from '../util/types'
import { jcss } from './../util/jcss'
import { Emoji } from '../Emoji'
import {
  MdiAdd,
  MdiContentCopy,
  MdiFileUpload,
  MdiSearch,
} from '../lib/MaterialIcons'

import { SearchAndConnectJinn } from './SearchAndConnect'

import styles from './ChainActionBar.module.css'

export type ChainActionBarSide = 'left' | 'right'

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

  const newDescription = `Create new & link to the ${side}`
  const newCopyDescription = `Copy & link to the ${side}`
  const uploadDescription = `Upload & link to the ${side}`
  const findDescription = `Find & link to the ${side}`

  const buttonClass = jcss(styles.tool_button, styles.toolbar_layout_item)

  return (
    <>
      <ButtonToolbar
        className={jcss(
          'd-flex',
          'justify-content-end',
          // buttons should be in opposite order on different sides
          // for visual symmetry
          side === 'left' ? 'flex-row-reverse' : '',
          styles.toolbar
        )}
      >
        <ImgButton
          className={buttonClass}
          onClick={() => handler.handleNext(ctx, side)}
          is_disabled={false}
        >
          <HoverTooltip tooltip={newDescription}>
            <MdiAdd />
          </HoverTooltip>
        </ImgButton>

        <ImgButton
          className={buttonClass}
          onClick={() => handler.handleNextClone(ctx, side)}
          is_disabled={false}
        >
          <HoverTooltip tooltip={newCopyDescription}>
            <MdiContentCopy />
          </HoverTooltip>
        </ImgButton>

        <UploadNodeButton
          className={buttonClass}
          as={ImgButton}
          from_nid={side === 'right' ? nid : null}
          to_nid={side === 'left' ? nid : null}
        >
          <HoverTooltip tooltip={uploadDescription}>
            <MdiFileUpload />
          </HoverTooltip>
        </UploadNodeButton>

        <ImgButton
          className={buttonClass}
          // className={styles.tool_button_img}
          onClick={() => setShowSearchModal(true)}
          is_disabled={false}
        >
          <HoverTooltip tooltip={findDescription}>
            <MdiSearch />
          </HoverTooltip>
        </ImgButton>
      </ButtonToolbar>
      <SearchAndConnectJinn
        nid={nid}
        addRef={addRef}
        show={showSearchModal}
        left={side === 'left'}
        setShow={setShowSearchModal}
      />
    </>
  )
}

export const ChainActionBar = ({
  side,
  nid,
  nidIsPrivate,
  cancelToken,
  addRef,
  className,
}: {
  side: ChainActionBarSide
  nid: string
  nidIsPrivate: boolean
  cancelToken: CancelToken
  addRef: ({ from, to }: { from: string; to: string }) => void
  className: string
}) => {
  return (
    <SmallCard className={jcss(className, styles.card)}>
      <span className={styles.side_title}>
        {side === 'left' ? <Emoji symbol={'👈 '} /> : null}
        Add to the {side}
        {side === 'right' ? <Emoji symbol={' 👉'} /> : null}
      </span>
      <ChainActionBarImpl
        side={side}
        nid={nid}
        nidIsPrivate={nidIsPrivate}
        cancelToken={cancelToken}
        addRef={addRef}
      />
    </SmallCard>
  )
}
