import React, { useContext, useState } from 'react'

import { ButtonToolbar } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import { ImgButton } from '../lib/ImgButton'
import { HoverTooltip } from '../lib/tooltip'
import { MzdGlobalContext, MzdGlobalContextProps } from '../lib/global'
import { goto, History } from '../lib/route'
import { SmallCard } from './SmallCard'

import { smuggler, NewNodeResponse } from 'smuggler-api'
import { makeACopy, TDoc } from '../doc/doc_util'
import { TNode } from 'smuggler-api'

import { UploadNodeButton } from '../upload/UploadNodeButton'
import { Optional } from '../util/types'
import { jcss } from './../util/jcss'
import { Emoji } from '../lib/Emoji'
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
  abortControler,
  isBlank = false,
}: {
  from?: string
  to?: string
  abortControler: AbortController
  isBlank?: boolean
}): Promise<Optional<NewNodeResponse>> {
  const nid: Optional<string> = from ? from : to ? to : null
  if (!nid) {
    return null
  }
  const node: Optional<TNode> = await smuggler.node.get({
    nid,
    abortControler,
  })
  if (!node) {
    return null
  }
  let doc = await TDoc.fromNodeTextData(node.getText())
  doc = doc.makeACopy(node.getNid(), isBlank || false)
  return await smuggler.node.create({
    doc: doc.toNodeTextData(),
    abortControler,
    from_nid: from,
    to_nid: to,
  })
}

class ChainActionHandler {
  nid: string
  nidIsPrivate: boolean
  abortControler: AbortController
  history: History

  constructor({
    nid,
    nidIsPrivate,
    history,
    abortControler,
  }: {
    nid: string
    nidIsPrivate: boolean
    abortControler: AbortController
    history: History
  }) {
    this.nid = nid
    this.nidIsPrivate = nidIsPrivate
    this.abortControler = abortControler
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
        doc: TDoc.makeEmpty().toNodeTextData(),
        abortControler: this.abortControler,
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
      abortControler: this.abortControler,
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
  abortControler,
  addRef,
}: {
  side: 'right' | 'left'
  nid: string
  nidIsPrivate: boolean
  abortControler: AbortController
  addRef: ({ from, to }: { from: string; to: string }) => void
}) => {
  const history = useHistory()
  const ctx = useContext(MzdGlobalContext)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const handler = new ChainActionHandler({
    nid,
    nidIsPrivate,
    abortControler,
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
  abortControler,
  addRef,
  className,
}: {
  side: ChainActionBarSide
  nid: string
  nidIsPrivate: boolean
  abortControler: AbortController
  addRef: ({ from, to }: { from: string; to: string }) => void
  className: string
}) => {
  return (
    <SmallCard className={jcss(className, styles.card)}>
      <span className={styles.side_title}>
        {side === 'left' ? <Emoji>👈 </Emoji> : null}
        Add to the {side}
        {side === 'right' ? <Emoji> 👉 </Emoji> : null}
      </span>
      <ChainActionBarImpl
        side={side}
        nid={nid}
        nidIsPrivate={nidIsPrivate}
        abortControler={abortControler}
        addRef={addRef}
      />
    </SmallCard>
  )
}
