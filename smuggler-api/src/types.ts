import { MimeType, Mime } from './util/mime'

import { smuggler } from './api'
import { AccountInterface } from './auth'

import moment from 'moment'

// TODO: get rid of duplication here with separate "util" package
export type Optional<T> = T | null | undefined

export type SlateText = object[]

function makeEmptySlate(plaintext?: string): SlateText {
  return [
    {
      type: 'paragraph',
      children: [
        {
          text: plaintext || '',
        },
      ],
    },
  ]
}

export function makeNodeTextData(plaintext?: string): NodeTextData {
  return {
    slate: makeEmptySlate(plaintext),
    draft: undefined,
    chunks: undefined,
  }
}

// see smuggler/src/types.rs
export type NodeTextData = {
  slate: SlateText | undefined
  // Deprecated
  draft: any | undefined
  // Deprecated
  chunks: any | undefined
}

export enum NodeType {
  Text = 0,
  Blob = 1,
  Url = 2,
}

// see smuggler/src/types.rs
export type NodeExtattrs = {
  content_type: MimeType
  title: Optional<string>
  description: Optional<string>
  lang: Optional<string>
  author: Optional<string>
  preview_image: Optional<PreviewImageSmall>
  web: Optional<NodeExtattrsWeb>
  blob: Optional<NodeExtattrsBlob>
}

// see smuggler/src/types.rs
export type PreviewImageSmall = {
  content_type: MimeType

  // Base64 encoded image for card preview_image, it must be small so we can
  // afford to store it to postgres DB
  // https://stackoverflow.com/questions/8499632/how-to-display-base64-images-in-html
  // https://en.wikipedia.org/wiki/Data_URI_scheme#Syntax
  data: string
}

export type NodeExtattrsBlob = {}

export type NodeExtattrsWeb = {
  // Web resource only related attributes
  // Store here any conditions or credentials to access that resource,
  // for example the resource is availiable only from certain contries
  url: string
}

export type NodeShare = {
  by_link: boolean
  with_uids: Optional<string[]>
}

export type NodeMeta = {
  share: Optional<NodeShare>
  local_secret_id: Optional<string>
  local_signature: Optional<string>
  uid: string
}

export type Color = {
  frac_red: number
  frac_green: number
  frac_blue: number
  alpha: number
}

export type NodeIndexText = {
  plaintext: Optional<string>
  labels: string[]
  brands: string[]
  dominant_colors: Color[]
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

  index_text: Optional<NodeIndexText>

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
    index_text: Optional<NodeIndexText>,
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
    return (
      ntype === NodeType.Blob && extattrs && Mime.isImage(extattrs.content_type)
    )
  }

  isWebBookmark() {
    const { ntype, extattrs } = this
    return (
      ntype === NodeType.Url &&
      extattrs &&
      extattrs.content_type === Mime.TEXT_URI_LIST
    )
  }

  getBlobSource(): Optional<string> {
    const { nid } = this
    return smuggler.blob.getSource(nid)
  }
}

export type EdgeAttributes = {
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

export type TNodeCrypto = {
  // Ideally encryption/decryption happens in a layer below TNode, so if code
  // uses TNode object it should not use encryption at all. But layers above
  // should be aware if node is encrypted, successfuly decrypted or
  // unsuccessfuly decrypted and why.
  success: boolean
  secret_id: string | null
}

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

export type NewNodeRequestBody = {
  text: Optional<NodeTextData>
  index_text: Optional<NodeIndexText>
  extattrs: Optional<NodeExtattrs>
}

export type NodePatchRequest = {
  text?: NodeTextData
  index_text?: NodeIndexText
  preserve_update_time?: boolean // Default is false
}

export type UploadMultipartResponse = {
  nids: string[]
  from: Optional<string>
  to: Optional<string>
}

export type BlobIndex = {
  filename: string
  index: NodeIndexText
}

export type GenerateBlobIndexResponse = {
  indexes: Array<BlobIndex>
}

export type NodeSearchItem = {
  nid: string
  ntype: NodeType
  crtd: number
  upd: number
  text: Optional<NodeTextData>
  extattrs: Optional<NodeExtattrs>
  index_text: Optional<NodeIndexText>
  meta: Optional<NodeMeta>
}

export type NodeAttrsSearchRequest = {
  start_time?: number // Absolute time - unix timestamp, seconds
  end_time?: number

  limit?: number // default is 256
  offset?: number // default is 0

  origin?: NodeOrigin
}

export type NodeAttrsSearchResponse = {
  nodes: NodeSearchItem[]
  full_size: number
  offset: number
  start_time: number // Absolute time - unix timestamp, seconds
  end_time: number
}

// Just for the time when interval types are landed to TS
export type Int32 = number

export type NodeOrigin = {
  id: Int32
}

export type UserBadge = {
  uid: string
  name: string
  photo: Optional<String>
}
