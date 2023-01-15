import { MimeType } from 'armoury'
import type { Optional } from 'armoury'
import { INodeIterator } from './node_slice_iterator'
import {
  TNode,
  NodePatchRequest,
  Ack,
  NodeTextData,
  NodeIndexText,
  NodeExtattrs,
  NodeType,
  OriginId,
  NodeCreatedVia,
  NewNodeResponse,
  Nid,
  NodeBatch,
  UploadMultipartResponse,
  GenerateBlobIndexResponse,
  TEdge,
  NodeEdges,
  AddUserActivityRequest,
  TotalUserActivity,
  AddUserExternalAssociationRequest,
  GetUserExternalAssociationsResponse,
  UserExternalPipelineId,
  UserExternalPipelineIngestionProgress,
  AdvanceExternalPipelineIngestionProgress,
  Eid,
} from './types'

export type NodeGetArgs = { nid: Nid }
export type NodeGetByOriginArgs = { origin: OriginId }
export type NodeUpdateArgs = { nid: Nid } & NodePatchRequest
export type NodeDeleteArgs = { nid: Nid }
export type NodeBulkDeleteArgs = { createdVia: NodeCreatedVia }
export type NodeCreateArgs = {
  text: NodeTextData
  from_nid?: Nid[]
  to_nid?: Nid[]
  index_text?: NodeIndexText
  extattrs?: NodeExtattrs
  ntype?: NodeType
  origin?: OriginId
  created_via?: NodeCreatedVia
  created_at?: Date
}

export type NodeBatchRequestBody = {
  nids: Nid[]
}

export type BlobUploadRequestArgs = {
  files: File[]
  from_nid: Optional<Nid>
  to_nid: Optional<Nid>
  createdVia: NodeCreatedVia
}

export type EdgeGetArgs = { nid: Nid }
export type EdgeCreateArgs = { from: Nid; to: Nid }
export type EdgeStickyArgs = {
  eid: string
  on: Optional<boolean>
  off: Optional<boolean>
}
export type EdgeDeleteArgs = { eid: Eid }

export type ActivityExternalAddArgs = {
  origin: OriginId
  activity: AddUserActivityRequest
}
export type ActivityExternalGetArgs = { origin: OriginId }

export type ActivityAssociationRecordArgs = {
  origin: {
    from: OriginId
    to: OriginId
  }
  body: AddUserExternalAssociationRequest
}
export type ActivityAssociationGetArgs = {
  origin: OriginId
}

export type ExternalIngestionGetArgs = {
  epid: UserExternalPipelineId
}
export type ExternalIngestionAdvanceArgs = {
  epid: UserExternalPipelineId
  new_progress: AdvanceExternalPipelineIngestionProgress
}

export type StorageApi = {
  node: {
    get: (args: NodeGetArgs, signal?: AbortSignal) => Promise<TNode>
    getByOrigin: (
      args: NodeGetByOriginArgs,
      signal?: AbortSignal
    ) => Promise<TNode[]>
    update: (args: NodeUpdateArgs, signal?: AbortSignal) => Promise<Ack>
    create: (
      args: NodeCreateArgs,
      signal?: AbortSignal
    ) => Promise<NewNodeResponse>
    iterate: () => INodeIterator
    delete: (args: NodeDeleteArgs, signal?: AbortSignal) => Promise<Ack>
    bulkDelete: (
      args: NodeBulkDeleteArgs,
      signal?: AbortSignal
    ) => Promise<number /* number of nodes deleted */>
    batch: {
      // TODO[snikitin@outlook.com] consider merging this into lookup() as another
      // @see NodeLookupKey option
      get: (
        args: NodeBatchRequestBody,
        signal?: AbortSignal
      ) => Promise<NodeBatch>
    }
    url: (nid: Nid) => string
  }
  blob: {
    upload: (
      args: BlobUploadRequestArgs,
      signal?: AbortSignal
    ) => Promise<UploadMultipartResponse>
    sourceUrl: (nid: Nid) => string
  }
  blob_index: {
    build: (
      files: File[],
      signal?: AbortSignal
    ) => Promise<GenerateBlobIndexResponse>
    /** 'cfg' section is intended to expose properties of one of smuggler's
     * endpoints *without using network*. This information is unlikely to change
     * during application runtime which makes repeated network usage wasteful.
     *
     * It may be tempting to bake them into respective endpoint methods directly
     * (e.g. into 'blob_index.build'), but that is intentionally avoided to
     * keep a clearer boundary between raw REST endpoints and helper functionality.
     *
     * Similar sections may become useful for other endpoints
     */
    cfg: {
      supportsMime: (mimeType: MimeType) => boolean
    }
  }
  edge: {
    create: (args: EdgeCreateArgs, signal?: AbortSignal) => Promise<TEdge>
    get: (args: EdgeGetArgs, signal?: AbortSignal) => Promise<NodeEdges>
    sticky: (args: EdgeStickyArgs, signal?: AbortSignal) => Promise<Ack>
    delete: (args: EdgeDeleteArgs, signal?: AbortSignal) => Promise<Ack>
  }
  activity: {
    external: {
      add: (
        args: ActivityExternalAddArgs,
        signal?: AbortSignal
      ) => Promise<TotalUserActivity>
      get: (
        args: ActivityExternalGetArgs,
        signal?: AbortSignal
      ) => Promise<TotalUserActivity>
    }
    association: {
      record: (
        args: ActivityAssociationRecordArgs,
        signal?: AbortSignal
      ) => Promise<Ack>
      get: (
        args: ActivityAssociationGetArgs,
        signal?: AbortSignal
      ) => Promise<GetUserExternalAssociationsResponse>
    }
  }
  external: {
    ingestion: {
      get: (
        args: ExternalIngestionGetArgs,
        signal?: AbortSignal
      ) => Promise<UserExternalPipelineIngestionProgress>
      advance: (
        args: ExternalIngestionAdvanceArgs,
        signal?: AbortSignal
      ) => Promise<Ack>
    }
  }
}
