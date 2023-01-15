import {
  NodeType,
  NodeTextData,
  SlateText,
  TNode,
  TNodeJson,
  TEdge,
  TEdgeJson,
} from './types'
import { AccountInterface } from './auth/account_interface'

import { Mime, MimeType } from 'armoury'
import moment from 'moment'

export function makeEmptyNodeTextData(): NodeTextData {
  const slate: SlateText = [{ type: 'paragraph', children: [{ text: '' }] }]
  return { slate, draft: undefined, chunks: undefined }
}

/** Utilities for @see TNode type */
export namespace NodeUtil {
  export function isOwnedBy(node: TNode, account?: AccountInterface): boolean {
    return (
      (account?.isAuthenticated() && account?.getUid() === node.meta?.uid) ||
      false
    )
  }

  export function isImage(node: TNode): boolean {
    const { ntype, extattrs } = node
    const res =
      ntype === NodeType.Blob && extattrs && Mime.isImage(extattrs.content_type)
    return res || false
  }

  export function isWebBookmark(node: TNode): boolean {
    const { ntype, extattrs } = node
    const res =
      ntype === NodeType.Url &&
      extattrs &&
      extattrs.content_type === MimeType.TEXT_URI_LIST
    return res || false
  }

  export function isWebQuote(node: TNode): boolean {
    const { ntype } = node
    return ntype === NodeType.WebQuote
  }

  export function toJson(node: TNode): TNodeJson {
    return {
      nid: node.nid,
      ntype: node.ntype,
      text: node.text,
      created_at: node.created_at.unix(),
      updated_at: node.updated_at.unix(),
      meta: node.meta,
      extattrs: node.extattrs,
      index_text: node.index_text,
      crypto: node.crypto,
    }
  }

  export function fromJson({
    nid,
    ntype,
    text,
    created_at,
    updated_at,
    meta,
    extattrs,
    index_text,
    crypto,
  }: TNodeJson): TNode {
    return {
      nid,
      ntype,
      text,
      created_at: moment.unix(created_at),
      updated_at: moment.unix(updated_at),
      meta,
      extattrs,
      index_text,
      crypto,
    }
  }
}

/** Utilities for @see TEdge type */
export namespace EdgeUtil {
  export function isOwnedBy(edge: TEdge, account?: AccountInterface): boolean {
    const res =
      account?.isAuthenticated() && account?.getUid() === edge.owned_by
    return res || false
  }
  export function fromJson(edge: TEdgeJson): TEdge {
    return {
      ...edge,
      crtd: moment.unix(edge.crtd),
      upd: moment.unix(edge.upd),
    }
  }
}
