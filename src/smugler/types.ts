import { TDoc } from '../doc/types'
import { Optional } from '../util/types'
import { MimeType } from '../util/Mime'
import { AnonymousAccount } from '../auth/local.jsx'

import { getDocSlate } from '../doc/doc_util'
import { SlateText } from '../doc/types'

import { debug } from './../util/log'

import { smugler } from './api'

import moment from 'moment'

// see smuggler/src/types.rs
export class NodeData {
  slate: Optional<SlateText>

  // Deprecated
  draft: Optional<any>

  // Deprecated
  chunks: Optional<any>

  /**
   * For Blob type of nodes (see NodeType::Blob) with externally saved large
   * blob of binary data like image, PDF, audio etc.
   */
  blob: Optional<NodeDataBlob>

  constructor(slate: Optional<SlateText>, blob: Optional<NodeDataBlob>) {
    this.slate = slate
    this.blob = blob
  }

  static async fromJson(v: object): NodeData {
    const { blob = null } = v
    if (blob) {
      // TODO(akindyakov) parse content_type of preview too
      blob.content_type = MimeType.parse(blob.content_type)
    }
    const slate = await getDocSlate(v) // (slate || draft || chunks)
    return new NodeData(slate, blob)
  }

  toJson(): object {
    let { blob = null, slate = null } = this
    if (blob) {
      const content_type = blob.content_type.toString()
      blob = {
        ...blob,
        content_type,
      }
    }
    return { slate, blob }
  }

  hasText(): boolean {
    const { slate } = this
    return !!slate
  }

  getText(): SlateText {
    const { slate } = this
    if (!slate) {
      throw Error('Node data must have text type to access text')
    }
    return slate
  }

  updateText(slate: SlateText): NodeData {
    const { blob } = this
    return new NodeData(slate, blob)
  }

  isImage(): boolean {
    const { blob } = this
    return blob && blob.content_type && blob.content_type.isImage()
  }

  getBlobSource(nid: string): string {
    return smugler.blob.getSource(nid)
  }
}

export enum NodeType {
  Text = 0,
  Blob = 1,
}

// see smuggler/src/types.rs
export class NodeDataBlob {
  content_type: MimeType
  preview: Optional<NodeDataBlobPreview>
}

// see smuggler/src/types.rs
export class NodeDataBlobPreview {
  content_type: MimeType

  // Base64 encoded image for card preview, it must be small so we can
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
  local_secret_id: Option<string>
  local_signature: Option<string>
  uid: Optional<string>
}

export class TNode {
  nid: string

  // There is no proper Unions or typed Enums in TypeScript, so I used optional
  // fields to represent different types of node: image or text document.
  data: NodeData

  created_at: moment
  updated_at: moment

  // Attributes of a node to be serialised and encrypted before submiting to the
  // server with local secret key
  attrs: Optional<TNodeAttrs>

  meta: NodeMeta

  // Information about node security
  crypto: TNodeCrypto

  ntype: NodeType

  constructor(
    nid: string,
    data: NodeData,
    created_at: moment,
    updated_at: moment,
    attrs: Optional<TNodeAttrs>,
    meta: NodeMeta,
    _crypto: TNodeCrypto
  ) {
    this.nid = nid
    this.data = data
    this.created_at = created_at
    this.updated_at = updated_at
    this.attrs = attrs
    this.meta = meta
    this.crypto = _crypto
    const { blob } = data
    if (blob) {
      this.ntype = NodeType.Blob
    } else {
      this.ntype = NodeType.Text
    }
  }

  isOwnedBy(account: Optional<AnonymousAccount>): boolean {
    return (
      account &&
      account.isAuthenticated() &&
      account.getUid() === this.getOwner()
    )
  }

  getOwner() {
    return this.meta.uid
  }

  hasText() {
    return this.data.hasText()
  }

  isImage() {
    const { ntype, data } = this
    return ntype === NodeType.Blob && data.isImage()
  }

  getBlobSource(): string {
    const { nid, data } = this
    return data.getBlobSource(nid)
  }
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
