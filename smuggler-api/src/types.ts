import { Mime } from 'armoury'
import type { MimeType } from 'armoury'
import moment from 'moment'

import { makeUrl } from './api_url'

export type SlateText = object[]

function makeSlateFromPlainText(plaintext?: string): SlateText {
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
    slate: makeSlateFromPlainText(plaintext),
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
  /** A node that refers to a URL web page *as a whole* (as opposed to @see WebQuote ) */
  Url = 2,
  /** A node that refers to a *part of* a URL web page (as opposed to @see Url ) */
  WebQuote = 3,

  // NOTE: When extending this enum, consider if existing node lookup methods
  // need to change (see NodeLookupKey)
}

/**
 * Unique lookup keys that can match at most 1 node
 */
export type UniqueNodeLookupKey =
  /** Due to nid's nature there can be at most 1 node with a particular nid */
  | { nid: string }
  /** Unique because many nodes can refer to the same URL, but only one of them
   * can be a bookmark */
  | { webBookmark: { url: string } }

export type NonUniqueNodeLookupKey =
  /** Can match more than 1 node because multiple parts of a single web page
   * can be quoted */
  | { webQuote: { url: string } }
  /** Can match more than 1 node because many nodes can refer to
   * the same URL:
   *    - 0 or 1 can be @see NoteType.Url
   *    - AND at the same time more than 1 can be @see NodeType.WebQuote */
  | { url: string }

/**
 * All the different types of keys that can be used to identify (during lookup,
 * for example) one or more nodes.
 */
export type NodeLookupKey = UniqueNodeLookupKey | NonUniqueNodeLookupKey

export function isUniqueLookupKey(
  key: NodeLookupKey
): key is UniqueNodeLookupKey {
  if ('nid' in key || 'webBookmark' in key) {
    return true
  }
  return false
}

// see smuggler/src/types.rs
export type NodeExtattrs = {
  content_type: MimeType
  title?: string
  description?: string
  lang?: string
  author?: string
  preview_image?: PreviewImageSmall
  web?: NodeExtattrsWeb
  blob?: NodeExtattrsBlob
  web_quote?: NodeExtattrsWebQuote
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

// / Represents textual quotation on a web page
export type NodeExtattrsWebQuote = {
  url: string
  path: string[]
  text: string
}

export type NodeShare = {
  by_link: boolean
  with_uids?: string[]
}

export type NodeMeta = {
  share?: NodeShare
  local_secret_id?: string
  local_signature?: string
  uid: string
}

export type Color = {
  frac_red: number
  frac_green: number
  frac_blue: number
  alpha: number
}

export type NodeIndexText = {
  plaintext?: string
  labels: string[]
  brands: string[]
  dominant_colors: Color[]
}

export type TNodeJson = {
  nid: string
  ntype: NodeType
  text: NodeTextData
  extattrs?: NodeExtattrs
  index_text?: NodeIndexText
  created_at: number
  updated_at: number
  meta?: NodeMeta
  crypto?: TNodeCrypto
}

export class TNode {
  nid: string
  ntype: NodeType

  text: NodeTextData
  extattrs?: NodeExtattrs
  index_text?: NodeIndexText

  created_at: moment.Moment
  updated_at: moment.Moment

  meta?: NodeMeta

  // Information about node security
  crypto?: TNodeCrypto

  constructor(
    nid: string,
    ntype: number,
    text: NodeTextData,
    created_at: moment.Moment,
    updated_at: moment.Moment,
    meta?: NodeMeta,
    extattrs?: NodeExtattrs,
    index_text?: NodeIndexText,
    _crypto?: TNodeCrypto
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

  isOwnedBy(account?: AccountInterface): boolean {
    return (
      (account?.isAuthenticated() && account?.getUid() === this.getOwner()) ||
      false
    )
  }

  getOwner(): string | null {
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

  isWebQuote() {
    const { ntype } = this
    return ntype === NodeType.WebQuote
  }

  getBlobSource(): string | null {
    const { nid } = this
    return makeUrl(`/blob/${nid}`)
  }

  toJson(): TNodeJson {
    return {
      nid: this.nid,
      ntype: this.ntype,
      text: this.text,
      created_at: this.created_at.unix(),
      updated_at: this.updated_at.unix(),
      meta: this.meta,
      extattrs: this.extattrs,
      index_text: this.index_text,
      crypto: this.crypto,
    }
  }

  static fromJson({
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
    return new TNode(
      nid,
      ntype,
      text,
      moment.unix(created_at),
      moment.unix(updated_at),
      meta,
      extattrs,
      index_text,
      crypto
    )
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

  isOwnedBy(account?: AccountInterface): boolean {
    return (
      (account?.isAuthenticated() && account?.getUid() === this.getOwner()) ||
      false
    )
  }
}

export type EdgeStar = {
  edges: TEdge[]
  from?: string
  to?: string
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
  from?: string
  to?: string
}

export type Ack = {
  ack: boolean
}

export type AccountInfo = {
  uid: string
  name: string
  email: string
}

export type NodeCreateRequestBody = {
  text?: NodeTextData
  index_text?: NodeIndexText
  extattrs?: NodeExtattrs
  origin?: NodeOrigin
}

export type NodePatchRequest = {
  text?: NodeTextData
  index_text?: NodeIndexText
  preserve_update_time?: boolean // Default is false
}

export type UploadMultipartResponse = {
  nids: string[]
  from?: string
  to?: string
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
  text?: NodeTextData
  extattrs?: NodeExtattrs
  index_text?: NodeIndexText
  meta?: NodeMeta
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
  photo?: String
}

/**
 * Local encryption is not ready to use yet, in fact it is not
 * part of our MVP, mock it for now.
 */
export class LocalCrypto {}

export interface AccountInterface {
  isAuthenticated: () => boolean
  getUid: () => string
  getName: () => string
  getEmail: () => string
  getLocalCrypto: () => LocalCrypto
}

export type UserFilesystemId = {
  uid: string
  // A value that uniquely identifies one of filesystems of a specific uid
  fs_key: string
}

export type UserFsIngestionProgress = {
  fsid: UserFilesystemId
  ingested_until: number // Absolute time - unix timestamp, seconds
}

export type AdvanceUserFsIngestionProgress = {
  ingested_until: number // See UserFsIngestionProgress
}
