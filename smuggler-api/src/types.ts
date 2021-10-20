import { MimeType } from './util/mime'

import { smuggler } from './api'
import { AccountInterface } from './auth'

import moment from 'moment'

// TODO: get rid of duplication here with separate "util" package
export type Optional<T> = T | null

export type SlateText = object[]

export function makeEmptySlate(): SlateText {
  return [
    {
      type: 'paragraph',
      children: [
        {
          text: '',
        },
      ],
    },
  ]
}

// see smuggler/src/types.rs
export class NodeTextData {
  slate: SlateText

  // Deprecated
  draft: Optional<any>

  // Deprecated
  chunks: Optional<any>

  constructor(slate: SlateText) {
    this.slate = slate
  }

  static fromJson({
    slate,
    draft,
    chunks,
  }: {
    slate?: SlateText
    draft?: object
    chunks?: any
  }): NodeTextData {
    if (slate == null) {
      slate = makeEmptySlate()
    }
    return new NodeTextData(slate)
  }

  toJson(): { slate: SlateText } {
    const { slate } = this
    return { slate }
  }

  getText(): SlateText {
    const { slate } = this
    if (slate) {
      return slate
    }
    return makeEmptySlate()
  }

  updateText(slate: SlateText): NodeTextData {
    return new NodeTextData(slate)
  }
}

export enum NodeType {
  Text = 0,
  Blob = 1,
  Url = 2,
}

// see smuggler/src/types.rs
export class NodeExtattrs {
  content_type: MimeType
  preview_image: Optional<NodeDataBlobPreview>

  constructor(
    content_type: MimeType,
    preview_image: Optional<NodeDataBlobPreview>
  ) {
    this.content_type = content_type
    this.preview_image = preview_image
  }

  isImage(): boolean {
    return this.content_type.isImage()
  }

  toJson(): object {
    const content_type = this.content_type.toString()
    const preview_image = this.preview_image
    return {
      content_type,
      preview_image,
    }
  }

  static fromJson({
    content_type,
    preview_image = null,
  }: {
    content_type: string
    preview_image: object | null
  }): NodeExtattrs {
    // TODO(akindyakov) parse content_type of preview_image too
    return new NodeExtattrs(
      MimeType.parse(content_type),
      preview_image == null ? null : (preview_image as NodeDataBlobPreview)
    )
  }

  getBlobSource(nid: string): string {
    return smuggler.blob.getSource(nid)
  }
}

// see smuggler/src/types.rs
export type NodeDataBlobPreview = {
  content_type: MimeType

  // Base64 encoded image for card preview_image, it must be small so we can
  // afford to store it to postgres DB
  // https://stackoverflow.com/questions/8499633/how-to-display-base64-images-in-html
  // https://en.wikipedia.org/wiki/Data_URI_scheme#Syntax
  data: String
}

export interface NodeShare {
  by_link: boolean
  with_uids: Optional<string[]>
}

export interface NodeMeta {
  share: Optional<NodeShare>
  local_secret_id: Optional<string>
  local_signature: Optional<string>
  uid: string
}

export type NodeTextIndex = {
  plaintext: Optional<string>
}

export class TNode {
  nid: string

  // There is no proper Unions or typed Enums in TypeScript, so I used optional
  // fields to represent different types of node: image or text document.
  text: NodeTextData

  /**
   * For Blob type of nodes (see NodeType::Blob) with externally saved large
   * blob of binary data like image, PDF, audio etc.
   */
  extattrs: Optional<NodeExtattrs>

  index_text: Optional<NodeTextIndex>

  created_at: moment.Moment
  updated_at: moment.Moment

  meta: Optional<NodeMeta>

  // Information about node security
  crypto: TNodeCrypto

  ntype: NodeType

  constructor(
    nid: string,
    ntype: number,
    text: NodeTextData,
    created_at: moment.Moment,
    updated_at: moment.Moment,
    meta: Optional<NodeMeta>,
    extattrs: Optional<NodeExtattrs>,
    index_text: Optional<NodeTextIndex>,
    _crypto: TNodeCrypto
  ) {
    this.nid = nid
    this.ntype = ntype
    this.text = text
    this.created_at = created_at
    this.updated_at = updated_at
    this.meta = meta
    this.extattrs = extattrs
    this.index_text = index_text
    this.crypto = _crypto
  }

  isOwnedBy(account: Optional<AccountInterface>): boolean {
    return (
      (account?.isAuthenticated() && account?.getUid() === this.getOwner()) ||
      false
    )
  }

  getOwner(): Optional<string> {
    return this.meta?.uid || null
  }

  getText(): NodeTextData {
    return this.text
  }

  getNid(): string {
    return this.nid
  }

  isImage() {
    const { ntype, extattrs } = this
    return ntype === NodeType.Blob && extattrs?.isImage()
  }

  getBlobSource(): Optional<string> {
    const { nid, extattrs } = this
    return extattrs?.getBlobSource(nid) || null
  }
}

export interface EdgeAttributes {
  eid: string
  txt?: string
  from_nid: string
  to_nid: string
  crtd: moment.Moment
  upd: moment.Moment
  weight?: number
  is_sticky: boolean
  owned_by: string
}

export class TEdge {
  eid: string
  txt?: string
  from_nid: string
  to_nid: string
  crtd: moment.Moment
  upd: moment.Moment
  weight?: number
  is_sticky: boolean
  owned_by: string

  constructor(edge: EdgeAttributes) {
    this.eid = edge.eid
    this.txt = edge.txt
    this.from_nid = edge.from_nid
    this.to_nid = edge.to_nid
    this.crtd = edge.crtd
    this.upd = edge.upd
    this.weight = edge.weight
    this.is_sticky = edge.is_sticky
    this.owned_by = edge.owned_by
  }

  getOwner(): string {
    return this.owned_by
  }

  isOwnedBy(account: Optional<AccountInterface>): boolean {
    return (
      (account?.isAuthenticated() && account?.getUid() === this.getOwner()) ||
      false
    )
  }
}

export type EdgeStar = {
  edges: TEdge[]
  from: Optional<string>
  to: Optional<string>
}

export interface TNodeCrypto {
  // Ideally encryption/decryption happens in a layer below TNode, so if code
  // uses TNode object it should not use encryption at all. But layers above
  // should be aware if node is encrypted, successfuly decrypted or
  // unsuccessfuly decrypted and why.
  success: boolean
  secret_id: string | null
}

export interface TNodeAttrs {
  ngrams: Array<string>
  salt: string
}

export interface TImage {}

export type NewNodeResponse = {
  nid: string
  from: Optional<string>
  to: Optional<string>
}

export type Ack = {
  ack: boolean
}

export type AccountInfo = {
  uid: string
  name: string
  email: string
}
