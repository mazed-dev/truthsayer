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
} from './types'

export type CreateNodeArgs = {
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

export type CreateEdgeArgs = {
  from?: Nid
  to?: Nid
  signal: AbortSignal
}

export type SwitchEdgeStickinessArgs = {
  eid: string
  on: Optional<boolean>
  off: Optional<boolean>
  signal: AbortSignal
}

export type StorageApi = {
  node: {
    get: ({ nid, signal }: { nid: Nid; signal?: AbortSignal }) => Promise<TNode>
    getByOrigin: ({
      origin,
      signal,
    }: {
      origin: OriginId
      signal?: AbortSignal
    }) => Promise<TNode[]>
    update: (
      args: { nid: Nid } & NodePatchRequest,
      signal?: AbortSignal
    ) => Promise<Ack>
    create: (
      args: CreateNodeArgs,
      signal?: AbortSignal
    ) => Promise<NewNodeResponse>
    slice: () => INodeIterator
    delete: ({
      nid,
      signal,
    }: {
      nid: Nid
      signal?: AbortSignal
    }) => Promise<Ack>
    bulkDelete: ({
      createdVia,
      signal,
    }: {
      createdVia: NodeCreatedVia
      signal?: AbortSignal
    }) => Promise<number /* number of nodes deleted */>
    batch: {
      // TODO[snikitin@outlook.com] consider merging this into lookup() as another
      // @see NodeLookupKey option
      get: (
        req: NodeBatchRequestBody,
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
    create: (args: CreateEdgeArgs) => Promise<TEdge>
    get: (nid: Nid, signal?: AbortSignal) => Promise<NodeEdges>
    sticky: (args: SwitchEdgeStickinessArgs) => Promise<Ack>
    delete: ({
      eid,
      signal,
    }: {
      eid: string
      signal: AbortSignal
    }) => Promise<Ack>
  }
  activity: {
    external: {
      add: (
        origin: OriginId,
        activity: AddUserActivityRequest,
        signal?: AbortSignal
      ) => Promise<TotalUserActivity>
      get: (
        origin: OriginId,
        signal?: AbortSignal
      ) => Promise<TotalUserActivity>
    }
    association: {
      record: (
        origin: {
          from: OriginId
          to: OriginId
        },
        body: AddUserExternalAssociationRequest,
        signal?: AbortSignal
      ) => Promise<Ack>
      get: (
        {
          origin,
        }: {
          origin: OriginId
        },
        signal?: AbortSignal
      ) => Promise<GetUserExternalAssociationsResponse>
    }
  }
  external: {
    ingestion: {
      get: (
        epid: UserExternalPipelineId,
        signal?: AbortSignal
      ) => Promise<UserExternalPipelineIngestionProgress>
      advance: (
        epid: UserExternalPipelineId,
        new_progress: AdvanceExternalPipelineIngestionProgress,
        signal?: AbortSignal
      ) => Promise<Ack>
    }
  }
}
