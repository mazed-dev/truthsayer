import { MimeType } from 'armoury'
import type {
  Ack,
  GenerateBlobIndexResponse,
  GetUserExternalAssociationsResponse,
  NewNodeResponse,
  Nid,
  NodeSimilaritySearchInfo,
  TEdgeJson,
  TNode,
  TNodeJson,
  TotalUserActivity,
  UploadMultipartResponse,
  UserExternalPipelineIngestionProgress,
} from './types'
import type {
  ActivityAssociationGetArgs,
  ActivityAssociationRecordArgs,
  ActivityExternalAddArgs,
  ActivityExternalGetArgs,
  BlobUploadRequestArgs,
  EdgeCreateArgs,
  EdgeDeleteArgs,
  EdgeGetArgs,
  EdgeStickyArgs,
  ExternalIngestionAdvanceArgs,
  ExternalIngestionGetArgs,
  NodeBatchRequestBody,
  NodeBulkDeleteArgs,
  NodeCreateArgs,
  NodeDeleteArgs,
  NodeGetAllNidsArgs,
  NodeGetArgs,
  NodeGetByOriginArgs,
  NodeUpdateArgs,
  SetNodeSimilaritySearchInfoArgs,
  StorageApi,
} from './storage_api'
import type { INodeIterator } from './node_slice_iterator'
import { NodeUtil, EdgeUtil } from './typesutil'

export type StorageApiMsgPayload =
  | { apiName: 'node.get'; args: NodeGetArgs }
  | { apiName: 'node.getByOrigin'; args: NodeGetByOriginArgs }
  | { apiName: 'node.getAllNids'; args: NodeGetAllNidsArgs }
  | { apiName: 'node.update'; args: NodeUpdateArgs }
  | { apiName: 'node.create'; args: NodeCreateArgs }
  | { apiName: 'node.delete'; args: NodeDeleteArgs }
  | { apiName: 'node.bulkDelete'; args: NodeBulkDeleteArgs }
  | { apiName: 'node.batch.get'; args: NodeBatchRequestBody }
  | { apiName: 'blob.upload'; args: BlobUploadRequestArgs }
  | { apiName: 'blob_index.build'; args: File[] }
  | { apiName: 'edge.create'; args: EdgeCreateArgs }
  | { apiName: 'edge.get'; args: EdgeGetArgs }
  | { apiName: 'edge.sticky'; args: EdgeStickyArgs }
  | { apiName: 'edge.delete'; args: EdgeDeleteArgs }
  | { apiName: 'activity.external.add'; args: ActivityExternalAddArgs }
  | { apiName: 'activity.external.get'; args: ActivityExternalGetArgs }
  | {
      apiName: 'activity.association.record'
      args: ActivityAssociationRecordArgs
    }
  | { apiName: 'activity.association.get'; args: ActivityAssociationGetArgs }
  | { apiName: 'external.ingestion.get'; args: ExternalIngestionGetArgs }
  | {
      apiName: 'external.ingestion.advance'
      args: ExternalIngestionAdvanceArgs
    }
  | { apiName: 'node.similarity.getIndex'; args: NodeGetArgs }
  | {
      apiName: 'node.similarity.setIndex'
      args: SetNodeSimilaritySearchInfoArgs
    }

export type StorageApiMsgReturnValue =
  | { apiName: 'node.get'; ret: TNodeJson }
  | { apiName: 'node.getByOrigin'; ret: TNodeJson[] }
  | { apiName: 'node.getAllNids'; ret: Nid[] }
  | { apiName: 'node.update'; ret: Ack }
  | { apiName: 'node.create'; ret: NewNodeResponse }
  | { apiName: 'node.delete'; ret: Ack }
  | { apiName: 'node.bulkDelete'; ret: number }
  | { apiName: 'node.batch.get'; ret: { nodes: TNodeJson[] } }
  | { apiName: 'blob.upload'; ret: UploadMultipartResponse }
  | { apiName: 'blob_index.build'; ret: GenerateBlobIndexResponse }
  | { apiName: 'blob_index.cfg.supportsMime'; ret: boolean }
  | { apiName: 'edge.create'; ret: TEdgeJson }
  | {
      apiName: 'edge.get'
      ret: {
        from_edges: TEdgeJson[]
        to_edges: TEdgeJson[]
      }
    }
  | { apiName: 'edge.sticky'; ret: Ack }
  | { apiName: 'edge.delete'; ret: Ack }
  | { apiName: 'activity.external.add'; ret: TotalUserActivity }
  | { apiName: 'activity.external.get'; ret: TotalUserActivity }
  | { apiName: 'activity.association.record'; ret: Ack }
  | {
      apiName: 'activity.association.get'
      ret: GetUserExternalAssociationsResponse
    }
  | {
      apiName: 'external.ingestion.get'
      ret: UserExternalPipelineIngestionProgress
    }
  | { apiName: 'external.ingestion.advance'; ret: Ack }
  | {
      apiName: 'node.similarity.getIndex'
      ret: NodeSimilaritySearchInfo
    }
  | { apiName: 'node.similarity.setIndex'; ret: Ack }

function mismatchError(sent: string, got: string): Error {
  return new Error(`Sent ${sent} StorageApi message, received ${got}`)
}

function throwUnimplementedError(endpoint: string) {
  return (..._: any[]): never => {
    throw new Error(
      `Attempted to call an ${endpoint} endpoint of message proxy StorageApi which hasn't been implemented yet`
    )
  }
}

/**
 * A functor that a message proxy implementation of @see StorageApi (which
 * doesn't have direct access to any storages) uses to forward a storage access
 * request to a "real" @see StorageApi (which does have direct access)
 */
export type ForwardToRealImpl = (
  payload: StorageApiMsgPayload
) => Promise<StorageApiMsgReturnValue>

class MsgProxyNodeIterator implements INodeIterator {
  private nids: Nid[]
  private index: number
  private forward: (
    payload: StorageApiMsgPayload
  ) => Promise<StorageApiMsgReturnValue>

  constructor(forward: ForwardToRealImpl, nids: Nid[]) {
    this.forward = forward
    this.nids = nids
    this.index = 0
  }

  static async create(
    forward: ForwardToRealImpl
  ): Promise<MsgProxyNodeIterator> {
    const apiName = 'node.getAllNids'
    const nids = await forward({ apiName, args: {} }).then(
      (value: StorageApiMsgReturnValue) => {
        if (apiName !== value.apiName) {
          throw mismatchError(apiName, value.apiName)
        }
        const ret: Nid[] = value.ret
        return ret
      }
    )
    return new MsgProxyNodeIterator(forward, nids)
  }

  async next(): Promise<TNode | null> {
    if (this.index >= this.nids.length) {
      return null
    }
    const nid: Nid = this.nids[this.index]
    const apiName = 'node.get'
    const value = await this.forward({ apiName, args: { nid } })
    if (apiName !== value.apiName) throw mismatchError(apiName, value.apiName)

    ++this.index
    const ret: TNodeJson = value.ret
    return NodeUtil.fromJson(ret)
  }
  total(): number {
    return this.index
  }
  abort(): void {
    this.index = 0
    this.nids = []
  }
}

export function makeMsgProxyStorageApi(forward: ForwardToRealImpl): StorageApi {
  return {
    node: {
      get: async (args: NodeGetArgs) => {
        const apiName = 'node.get'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: TNodeJson = resp.ret
        return NodeUtil.fromJson(ret)
      },
      getByOrigin: async (args: NodeGetByOriginArgs) => {
        const apiName = 'node.getByOrigin'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: TNodeJson[] = resp.ret
        return ret.map((value) => NodeUtil.fromJson(value))
      },
      getAllNids: async (args: NodeGetAllNidsArgs) => {
        const apiName = 'node.getAllNids'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: Nid[] = resp.ret
        return ret
      },
      update: async (args: NodeUpdateArgs) => {
        const apiName = 'node.update'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: Ack = resp.ret
        return ret
      },
      create: async (args: NodeCreateArgs) => {
        const apiName = 'node.create'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: NewNodeResponse = resp.ret
        return ret
      },
      iterate: () => MsgProxyNodeIterator.create(forward),
      delete: async (args: NodeDeleteArgs) => {
        const apiName = 'node.delete'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: Ack = resp.ret
        return ret
      },
      bulkDelete: async (args: NodeBulkDeleteArgs) => {
        const apiName = 'node.bulkDelete'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: number = resp.ret
        return ret
      },
      batch: {
        get: async (args: NodeBatchRequestBody) => {
          const apiName = 'node.batch.get'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: { nodes: TNodeJson[] } = resp.ret
          return { nodes: ret.nodes.map((value) => NodeUtil.fromJson(value)) }
        },
      },
      url: () => 'https://mazed.se/unimplemented-yet',
      addListener: throwUnimplementedError('node.addListener'),
      removeListener: throwUnimplementedError('node.removeListener'),
      similarity: {
        getIndex: async (args: NodeGetArgs) => {
          const apiName = 'node.similarity.getIndex'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: NodeSimilaritySearchInfo = resp.ret
          return ret
        },
        setIndex: async (args: SetNodeSimilaritySearchInfoArgs) => {
          const apiName = 'node.similarity.setIndex'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: Ack = resp.ret
          return ret
        },
      },
    },
    blob: {
      upload: async (args: BlobUploadRequestArgs) => {
        const apiName = 'blob.upload'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: UploadMultipartResponse = resp.ret
        return ret
      },
      sourceUrl: () => 'https://mazed.se/unimplemented-yet',
    },
    blob_index: {
      build: async (files: File[]) => {
        const apiName = 'blob_index.build'
        const resp = await forward({ apiName, args: files })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: GenerateBlobIndexResponse = resp.ret
        return ret
      },
      cfg: {
        supportsMime: (_mimeType: MimeType) => false,
      },
    },
    edge: {
      create: async (args: EdgeCreateArgs) => {
        const apiName = 'edge.create'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: TEdgeJson = resp.ret
        return EdgeUtil.fromJson(ret)
      },
      get: async (args: EdgeGetArgs) => {
        const apiName = 'edge.get'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: {
          from_edges: TEdgeJson[]
          to_edges: TEdgeJson[]
        } = resp.ret
        return {
          from_edges: ret.from_edges.map((value) => EdgeUtil.fromJson(value)),
          to_edges: ret.to_edges.map((value) => EdgeUtil.fromJson(value)),
        }
      },
      sticky: async (args: EdgeStickyArgs) => {
        const apiName = 'edge.sticky'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: Ack = resp.ret
        return ret
      },
      delete: async (args: EdgeDeleteArgs) => {
        const apiName = 'edge.delete'
        const resp = await forward({ apiName, args })
        if (apiName !== resp.apiName) throw mismatchError(apiName, resp.apiName)
        const ret: Ack = resp.ret
        return ret
      },
    },
    activity: {
      external: {
        add: async (args: ActivityExternalAddArgs) => {
          const apiName = 'activity.external.add'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: TotalUserActivity = resp.ret
          return ret
        },
        get: async (args: ActivityExternalGetArgs) => {
          const apiName = 'activity.external.get'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: TotalUserActivity = resp.ret
          return ret
        },
      },
      association: {
        record: async (args: ActivityAssociationRecordArgs) => {
          const apiName = 'activity.association.record'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: Ack = resp.ret
          return ret
        },
        get: async (args: ActivityAssociationGetArgs) => {
          const apiName = 'activity.association.get'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: GetUserExternalAssociationsResponse = resp.ret
          return ret
        },
      },
    },
    external: {
      ingestion: {
        get: async (args: ExternalIngestionGetArgs) => {
          const apiName = 'external.ingestion.get'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: UserExternalPipelineIngestionProgress = resp.ret
          return ret
        },
        advance: async (args: ExternalIngestionAdvanceArgs) => {
          const apiName = 'external.ingestion.advance'
          const resp = await forward({ apiName, args })
          if (apiName !== resp.apiName)
            throw mismatchError(apiName, resp.apiName)
          const ret: Ack = resp.ret
          return ret
        },
      },
    },
  }
}

// TODO[snikitin@outlook.com] Document that input storage is NOT supposed to be
// the message proxy implementation, it is supposed to be the underlying, "real"
// storage
export async function processMsgFromMsgProxyStorageApi(
  storage: StorageApi,
  payload: StorageApiMsgPayload
): Promise<StorageApiMsgReturnValue> {
  switch (payload.apiName) {
    case 'node.get':
      return {
        apiName: payload.apiName,
        ret: NodeUtil.toJson(await storage.node.get(payload.args)),
      }
    case 'node.getByOrigin':
      return {
        apiName: payload.apiName,
        ret: (await storage.node.getByOrigin(payload.args)).map((value) =>
          NodeUtil.toJson(value)
        ),
      }
    case 'node.getAllNids':
      return {
        apiName: payload.apiName,
        ret: await storage.node.getAllNids(payload.args),
      }

    case 'node.update':
      return {
        apiName: payload.apiName,
        ret: await storage.node.update(payload.args),
      }
    case 'node.create':
      return {
        apiName: payload.apiName,
        ret: await storage.node.create(payload.args),
      }
    case 'node.delete':
      return {
        apiName: payload.apiName,
        ret: await storage.node.delete(payload.args),
      }
    case 'node.bulkDelete':
      return {
        apiName: payload.apiName,
        ret: await storage.node.bulkDelete(payload.args),
      }
    case 'node.similarity.getIndex':
      return {
        apiName: payload.apiName,
        ret: await storage.node.similarity.getIndex(payload.args),
      }
    case 'node.similarity.setIndex':
      return {
        apiName: payload.apiName,
        ret: await storage.node.similarity.setIndex(payload.args),
      }
    case 'node.batch.get': {
      const ret = await storage.node.batch.get(payload.args)
      return {
        apiName: payload.apiName,
        ret: {
          nodes: ret.nodes.map((value) => NodeUtil.toJson(value)),
        },
      }
    }
    case 'blob.upload':
      return {
        apiName: payload.apiName,
        ret: await storage.blob.upload(payload.args),
      }
    case 'blob_index.build':
      return {
        apiName: payload.apiName,
        ret: await storage.blob_index.build(payload.args),
      }
    case 'edge.create':
      return {
        apiName: payload.apiName,
        ret: EdgeUtil.toJson(await storage.edge.create(payload.args)),
      }
    case 'edge.get':
      const ret = await storage.edge.get(payload.args)
      return {
        apiName: payload.apiName,
        ret: {
          from_edges: ret.from_edges.map((value) => EdgeUtil.toJson(value)),
          to_edges: ret.to_edges.map((value) => EdgeUtil.toJson(value)),
        },
      }
    case 'edge.sticky':
      return {
        apiName: payload.apiName,
        ret: await storage.edge.sticky(payload.args),
      }
    case 'edge.delete':
      return {
        apiName: payload.apiName,
        ret: await storage.edge.delete(payload.args),
      }
    case 'activity.external.add':
      return {
        apiName: payload.apiName,
        ret: await storage.activity.external.add(payload.args),
      }
    case 'activity.external.get':
      return {
        apiName: payload.apiName,
        ret: await storage.activity.external.get(payload.args),
      }
    case 'activity.association.record':
      return {
        apiName: payload.apiName,
        ret: await storage.activity.association.record(payload.args),
      }
    case 'activity.association.get':
      return {
        apiName: payload.apiName,
        ret: await storage.activity.association.get(payload.args),
      }
    case 'external.ingestion.get':
      return {
        apiName: payload.apiName,
        ret: await storage.external.ingestion.get(payload.args),
      }
    case 'external.ingestion.advance':
      return {
        apiName: payload.apiName,
        ret: await storage.external.ingestion.advance(payload.args),
      }
  }
}
