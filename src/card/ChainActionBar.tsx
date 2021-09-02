import React, { useContext } from 'react'

import { Button, ButtonGroup } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'
import { History } from 'history'
import { CancelToken } from 'axios'

import { HoverTooltip } from '../lib/tooltip'
import { ImgButton } from '../lib/ImgButton'
import { MzdGlobalContext, MzdGlobalContextProps } from '../lib/global'
import { goto } from '../lib/route.jsx'

import { smugler, NewNodeResponse } from '../smugler/api'
import { UserAccount } from '../auth/local'
import { makeACopy } from '../doc/doc_util'
import { TNode, NodeData } from '../smugler/types'

import NextNewRightImg from './../img/next-link-right-00001.png'
import NextNewLeftImg from './../img/next-link-left-00001.png'

import NextCopyLeftImg from './../img/next-clone-left.png'
import NextCopyRightImg from './../img/next-clone-right.png'
import { LocalCrypto } from '../crypto/local'

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
  history: History
  cancelToken: CancelToken

  constructor({
    nid,
    nidIsPrivate,
    history,
    cancelToken,
  }: {
    nid: string
    nidIsPrivate: boolean
    history: History
    cancelToken: CancelToken
  }) {
    this.nid = nid
    this.nidIsPrivate = nidIsPrivate
    this.history = history
    this.cancelToken = cancelToken
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

export const ChainActionBar = ({
  side,
  nid,
  nidIsPrivate,
  cancelToken,
}: {
  side: ChainActionBarSide
  nid: string
  nidIsPrivate: boolean
  cancelToken: CancelToken
}) => {
  const ctx = useContext(MzdGlobalContext)
  const handler = new ChainActionHandler({
    nid,
    nidIsPrivate,
    cancelToken,
    // TODO[snikitin@outlook.com] What does history do? Does it need to be passed down from the
    // main card?
    useHistory(),
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
        <HoverTooltip tooltip={`Copy & link to the ${side}`}>
          <ImgButton
            className="test"
            onClick={() => handler.handleNextClone(ctx, side)}
            is_disabled={false}
          >
            <img
              src={side === 'right' ? NextCopyRightImg : NextCopyLeftImg}
              // className={styles.tool_button_img}
              // alt="Link to the right"
            />
          </ImgButton>
        </HoverTooltip>
      </ButtonGroup>
    </div>
  )
}
