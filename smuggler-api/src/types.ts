import { MimeType, unixtime } from 'armoury'
import moment from 'moment'

export type SlateText = object[]

export type Nid = string
export type Eid = string

// Types related to old document types

export type DocChunkDeprecated = {
  type: number
  source: string
}
export type ChunkedDocDeprecated = DocChunkDeprecated[]
export type DraftBlockDeprecated = {
  data?: object
  depth?: number
  entityRanges?: any[]
  inlineStyleRanges?: any[]
  key: string
  text: string
  type?: string
}
export type DraftDocDeprecated = {
  blocks: DraftBlockDeprecated[]
  entityMap?: object
}

// see smuggler/src/types.rs
export type NodeTextData = {
  slate: SlateText
  // Deprecated
  draft?: DraftDocDeprecated
  // Deprecated
  chunks?: ChunkedDocDeprecated
}

export enum NodeType {
  Text = 0,
  Blob = 1,
  /** A node that refers to a an entity described by a URL, *as a whole* (as opposed to @see WebQuote ) */
  Url = 2,
  /** A node that refers to a *part of* a URL web page (as opposed to @see Url ) */
  WebQuote = 3,

  // NOTE: When extending this enum, consider if existing node lookup methods
  // need to change (see NodeLookupKey)
}

/** Describes what action is responsible for creation of an associated node */
export type NodeCreatedVia =
  /** Node was created based on an explicit, manual request from a human user  */
  | { manualAction: null }
  /** Node was created based on automatic evaluation of human user's behaviour,
  e.g. if user payed a lot of attention to particular web page.
  See user_external_activity.rs for more information. */
  | { autoAttentionTracking: null }
  /** Node was created through automatic ingestion from one of user's data pipelines.
  See user_external_ingestion for more information */
  | { autoIngestion: UserExternalPipelineId }

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
  /** DEPRECATED, DO NOT USE */
  content_type?: MimeType

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

export type TextContentBlockType = 'P' | 'H'
export type TextContentBlock = {
  text: string
  type: TextContentBlockType
  level?: number
}

export type NodeIndexText = {
  plaintext?: string
  text_blocks?: TextContentBlock[]
  labels: string[]
  brands: string[]
  dominant_colors: Color[]
}

export type TNodeJson = {
  nid: Nid
  ntype: NodeType
  text: NodeTextData
  extattrs?: NodeExtattrs
  index_text?: NodeIndexText
  created_at: unixtime.Type
  updated_at: unixtime.Type
  meta?: NodeMeta
  crypto?: TNodeCrypto
}

export type TNode = {
  nid: Nid
  ntype: NodeType

  text: NodeTextData
  extattrs?: NodeExtattrs
  index_text?: NodeIndexText

  created_at: moment.Moment
  updated_at: moment.Moment

  meta?: NodeMeta

  // Information about node security
  crypto?: TNodeCrypto
}

export type TEdge = {
  eid: Eid
  txt?: string
  from_nid: Nid
  to_nid: Nid
  crtd: moment.Moment
  upd: moment.Moment
  weight?: number
  is_sticky: boolean
  owned_by?: string // DEPRECATED
}

export type TEdgeJson = {
  eid: Eid
  txt?: string
  from_nid: Nid
  to_nid: Nid
  crtd: number
  upd: number
  weight?: number
  is_sticky: boolean
  owned_by?: string // DEPRECATED
}

/**
 * Edges of a given node
 *
 * [from-0]─┐           ┌─▶[to-0]
 * [from-1]─┼─▶[ node ]─┼─▶[to-1]
 * [from-2]─┘           └─▶[to-2]
 */
export type NodeEdges = {
  from_edges: TEdge[]
  to_edges: TEdge[]
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
  nid: Nid
  from?: Nid
  to?: Nid
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
  origin?: OriginId
  created_via?: NodeCreatedVia
}

export type NodePatchRequest = {
  text?: NodeTextData
  index_text?: NodeIndexText
  preserve_update_time?: boolean // Default is false
}

export type UploadMultipartRequestBody = {
  from?: Nid
  to?: Nid
  archived?: boolean
  created_via: NodeCreatedVia
}

export type UploadMultipartResponse = {
  nids: Nid[]
  from?: Nid
  to?: Nid
}

export type BlobIndex = {
  filename: string
  index: NodeIndexText
}

export type GenerateBlobIndexResponse = {
  indexes: Array<BlobIndex>
}

export type NodeSearchItem = {
  nid: Nid
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

  origin?: OriginId
}

export type NodeAttrsSearchResponse = {
  nodes: NodeSearchItem[]
  full_size: number
  offset: number
  start_time: number // Absolute time - unix timestamp, seconds
  end_time: number
}

/**
 * 🔓💩 The nature of this hash is suspected to be likely insecure.
 */
// The corresponding smuggler type is int32. Consider using interval types instead
// of a plain 'number' if and when they are introduced to TS. See
// https://github.com/microsoft/TypeScript/issues/43505 for more information
export type OriginHash = number

/** 🔐 Expected to eventually be ineligible to admins. */
export type OriginId = {
  id: OriginHash
}

/** 🔐 Expected to be encrypted before sending to smuggler */
export type OriginAddress = {
  url?: string
}

export type UserBadge = {
  uid: string
  name: string
  photo?: String
}

export type UserExternalPipelineId = {
  // A value that uniquely identifies one of the external pipelines of a specific uid
  pipeline_key: string
}

export type UserExternalPipelineIngestionProgress = {
  epid: UserExternalPipelineId
  ingested_until: number // Absolute time - unix timestamp, seconds; inclusive boundary
}

export type AdvanceExternalPipelineIngestionProgress = {
  ingested_until: number // See UserExternalPipelineIngestionProgress
}

export type ResourceVisit = {
  timestamp: number
}

export type ResourceAttention = {
  timestamp: number
  seconds: number
}

export type AddUserActivityRequest =
  | {
      visit?: {
        visits: ResourceVisit[]
        reported_by?: UserExternalPipelineId
      }
    }
  | {
      attention?: ResourceAttention
    }

export type TotalUserActivity = {
  visits: ResourceVisit[]
  seconds_of_attention: number
}

/**
 * One end of a relation between 2 origins
 */
export type OriginTransitionTip = {
  origin: OriginId
  address: OriginAddress
  // Current relation might be with another origin that is not yet saved as a
  // Node, thus it's a completely shadow edge and shadow node that later can be
  // promoted to a real node and edge
  nid?: Nid
}

/**
 * This is request to register 2 origins relation (shadow edge)
 *
 *   [from]──▶[to]
 */
export type AddUserExternalAssociationRequest = {
  association: UserExternalAssociationType
}

export type UserExternalAssociationType = {
  // / User transition between 2 URLs
  web_transition: {
    from_url: string
    to_url: string
  }
}

/**
 * Expect to see the following structure in the response:
 *
 * [from-0]─┐           ┌─▶[to-0]
 * [from-1]─┼─▶[origin]─┼─▶[to-1]
 * [from-2]─┘           └─▶[to-2]
 *
 * which is equivalent of the following set of shadow edges:
 * [
 *   [from-0, origin]
 *   [from-1, origin]
 *   [from-2, origin]
 *   [origin, to-0]
 *   [origin, to-1]
 *   [origin, to-2]
 *  ]
 */
export type GetUserExternalAssociationsResponse = {
  from: ExternalAssociation[]
  to: ExternalAssociation[]
}

export type ExternalAssociation = {
  // 🔓
  from: ExternalAssociationEnd
  // 🔓
  to: ExternalAssociationEnd
  // 🔐
  association: UserExternalAssociationType
}

export type ExternalAssociationEnd = {
  origin_hash: OriginHash
  nids: Nid[]
}

export type NodeBatch = {
  nodes: TNode[]
}

/**
 * Raw data to create tf.Tensor2D
 * https://js.tensorflow.org/api/2.3.0/#class:Tensor
 */
export type TfEmbeddingJson = {
  data: number[]
  shape: [number, number]
}

export type NodeBlockKey =
  | {
      field: 'index-txt'
      index: number
    }
  | {
      field: 'text' // comment
    }
  | {
      // Index web quote separatelly from the rest of extattrs for better quality
      // suggestions
      field: 'web-quote'
    }
  | {
      // To index the entire plain text representation of a node
      field: '*'
    }

export type NodeBlockKeyStr = string

export function getNodeStringField(
  node: TNode,
  blockKey: NodeBlockKey
): undefined | string {
  switch (blockKey.field) {
    case 'index-txt': {
      if (node.index_text?.text_blocks != null) {
        return node.index_text?.text_blocks[blockKey.index]?.text ?? undefined
      } else {
        return node.index_text?.plaintext
      }
    }
    case '*':
    case 'text':
    case 'web-quote':
      return undefined
  }
}

export function nodeBlockKeyToString(key: NodeBlockKey): string {
  switch (key.field) {
    case 'index-txt':
      return `${key.field}/${key.index}`
    case '*':
    case 'text':
    case 'web-quote':
      return key.field
  }
}

export function nodeBlockKeyFromString(key: string): NodeBlockKey {
  const components = key.split('/')
  if (components.length < 1 || components.length > 2) {
    throw new Error('Error 445 - TODO(Alexander)')
  }
  return {
    field: components[0],
    index: components.length > 1 ? parseInt(components[1]) : undefined,
  } as NodeBlockKey
}

export type TfEmbeddingForBlockJson = {
  key: NodeBlockKey
  embeddingJson: TfEmbeddingJson
}
export type NodeSimilaritySearchInfoSignature =
  | {
      algorithm: 'tf-embed'
      version: 1
    }
  | 'tf-embed-3'

export type NodeSimilaritySearchInfoLatestVerstion = {
  signature: 'tf-embed-3'
  forBlocks: Record<string, TfEmbeddingJson>
}

export type NodeSimilaritySearchInfo =
  | null
  | {
      signature: {
        algorithm: 'tf-embed'
        version: 1
      }
      embeddingJson: TfEmbeddingJson
    }
  | NodeSimilaritySearchInfoLatestVerstion

export function verifySimilaritySearchInfoVersion(
  simsearch: NodeSimilaritySearchInfo
): NodeSimilaritySearchInfoLatestVerstion | null {
  if (simsearch?.signature === 'tf-embed-3') {
    return simsearch
  }
  return null
}
