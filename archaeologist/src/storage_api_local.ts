/**
 * An implementation of @see smuggler-api.StorageApi that persists the data
 * on user device and is based on browser extension APIs.
 *
 * It is intended to work in all browser extension contexts (such as background,
 * content etc). See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
 * for more information.
 */

import {
  Ack,
  CreateNodeArgs,
  Eid,
  GetNodeSliceArgs,
  NewNodeResponse,
  Nid,
  NodeBatch,
  NodeBatchRequestBody,
  NodeCreatedVia,
  NodePatchRequest,
  NodeUtil,
  OriginId,
  StorageApi,
  TEdgeJson,
  TNode,
  TNodeJson,
  TNodeSliceIterator,
} from 'smuggler-api'
import { NodeType } from 'smuggler-api'
import { v4 as uuidv4 } from 'uuid'
import base32Encode from 'base32-encode'

import browser from 'webextension-polyfill'
import { MimeType, unixtime } from 'armoury'
import lodash from 'lodash'

// TODO[snikitin@outlook.com] Describe that "yek" is "key" in reverse,
// used to distinguish typesafe keys from just pure string keys used in
// browser.Storage.StorageArea
type GenericYek<Kind extends string, Key> = {
  yek: {
    kind: Kind
    key: Key
  }
}
// TODO[snikitin@outlook.com] Describe that "lav" is "val" (short for "value")
// in reverse, used to distinguish typesafe keys from just "any" JSON value used
// in browser.Storage.StorageArea
type GenericLav<Kind extends string, Value> = {
  lav: {
    kind: Kind
    value: Value
  }
}

type NidYek = GenericYek<'nid', Nid>
type NidLav = GenericLav<'nid', TNodeJson>

type OriginToNidYek = GenericYek<'origin->nid', OriginId>
type OriginToNidLav = GenericLav<'origin->nid', Nid[]>

type NidToEdgeYek = GenericYek<'nid->edge', Nid>
type NidToEdgeLav = GenericLav<'nid->edge', TEdgeJson[]>

type Yek = NidYek | OriginToNidYek | NidToEdgeYek
type Lav = NidLav | OriginToNidLav | NidToEdgeLav

// TODO[snikitin@outlook.com] Describe that the purpose of this wrapper is to
// add a bit of ORM-like typesafety to browser.Storage.StorageArea.
// Without this it's very difficult to keep track of what the code is doing
// and what it's supposed to do
class YekLavStore {
  private store: browser.Storage.StorageArea

  constructor(store: browser.Storage.StorageArea) {
    this.store = store
  }

  set(items: { yek: Yek; lav: Lav }[]): Promise<void> {
    for (const item of items) {
      if (item.yek.yek.kind !== item.lav.lav.kind) {
        throw new Error(
          `Attempted to set a key/value pair of mismatching kinds: '${item.yek.yek.kind}' !== '${item.lav.lav.kind}'`
        )
      }
    }
    let records: Record<string, any> = {}
    for (const item of items) {
      const key = this.stringify(item.yek)
      if (records.keys().indexOf(key) !== -1) {
        throw new Error(`Attempted to set more than 1 value for key '${key}'`)
      }
      records[key] = item.lav
    }
    return this.store.set(records)
  }

  get(yek: NidYek): Promise<NidLav | undefined>
  get(yek: OriginToNidYek): Promise<OriginToNidLav | undefined>
  get(yek: NidToEdgeYek): Promise<NidToEdgeLav | undefined>
  get(yek: NidYek[]): Promise<NidLav[]>
  get(yek: Yek | Yek[]): Promise<Lav | Lav[] | undefined> {
    if (Array.isArray(yek)) {
      const keys: string[] = yek.map((value: Yek) => this.stringify(value))
      const records: Promise<Record<string, any>> = this.store.get(keys)
      return records.then((records: Record<string, any>): Promise<Lav[]> => {
        const lavs: Lav[] = Object.keys(records).map(
          (key: string) => records[key] as Lav
        )
        return Promise.resolve(lavs)
      })
    }

    const key = this.stringify(yek)
    const records: Promise<Record<string, any>> = this.store.get(key)
    return records.then(
      (records: Record<string, any>): Promise<Lav | undefined> => {
        const record = records[key]
        if (record == null) {
          return Promise.resolve(undefined)
        }
        return Promise.resolve(record as Lav)
      }
    )
  }

  private stringify(yek: Yek): string {
    switch (yek.yek.kind) {
      case 'nid':
        return 'nid:' + yek.yek.key
      case 'origin->nid':
        return 'origin->nid:' + yek.yek.key
      case 'nid->edge':
        return 'nid->edge:' + yek.yek.key
    }
  }
}

function generateNid(): Nid {
  /**
   * The implementation tries to produce a @see Nid that's structurally similar
   * to the output of smuggler's NodeId::gen(). No attempts are made to mimic
   * its behaviour however.
   */
  const uuid = uuidv4()
  const array: Uint8Array = new TextEncoder().encode(uuid)
  return base32Encode(array, 'Crockford')
}

function generateEid(): Eid {
  /**
   * The implementation tries to produce a @see Eid that's structurally similar
   * to the output of smuggler's EdgeId::gen(). No attempts are made to mimic
   * its behaviour however.
   */
  return generateNid()
}

async function createNode(
  store: YekLavStore,
  args: CreateNodeArgs
): Promise<NewNodeResponse> {
  // TODO[snikitin@outlook.com] Below keys must become functional somehow.
  const created_via: NodeCreatedVia | undefined = args.created_via

  // TODO[snikitin@outlook.com] This graph structure has to work somehow
  const from_nid: Nid[] = args.from_nid ?? []
  const to_nid: Nid[] = args.to_nid ?? []

  const createdAt: number =
    args.created_at != null ? unixtime.from(args.created_at) : unixtime.now()

  const node: TNodeJson = {
    nid: generateNid(),
    ntype: args.ntype ?? NodeType.Text,
    text: args.text,
    extattrs: args.extattrs,
    index_text: args.index_text,
    created_at: createdAt,
    updated_at: createdAt,
  }

  let records: { yek: Yek; lav: Lav }[] = [
    {
      yek: { yek: { kind: 'nid', key: node.nid } },
      lav: { lav: { kind: 'nid', value: node } },
    },
  ]

  if (args.origin) {
    const yek: OriginToNidYek = {
      yek: { kind: 'origin->nid', key: args.origin },
    }
    let lav: OriginToNidLav | undefined = await store.get(yek)
    lav = lav ?? { lav: { kind: 'origin->nid', value: [] } }
    const nidsWithThisOrigin: Nid[] = lav.lav.value
    nidsWithThisOrigin.push(node.nid)
    records.push({ yek, lav })
  }

  if (from_nid.length > 0 || to_nid.length > 0) {
    // TODO[snikitin@outlook.com] Evaluate if ownership support is needed
    // and implement if yes
    const owned_by = 'todo'

    const from_edges: TEdgeJson[] = from_nid.map((from_nid: Nid): TEdgeJson => {
      return {
        eid: generateEid(),
        from_nid,
        to_nid: node.nid,
        crtd: createdAt,
        upd: createdAt,
        is_sticky: false,
        owned_by,
      }
    })
    const to_edges: TEdgeJson[] = to_nid.map((to_nid: Nid): TEdgeJson => {
      return {
        eid: generateEid(),
        from_nid: node.nid,
        to_nid,
        crtd: createdAt,
        upd: createdAt,
        is_sticky: false,
        owned_by,
      }
    })

    const yek: NidToEdgeYek = { yek: { kind: 'nid->edge', key: node.nid } }
    let lav: NidToEdgeLav = {
      lav: { kind: 'nid->edge', value: lodash.concat(from_edges, to_edges) },
    }
    // TODO[snikitin@outlook.com] This creates edges for node.nid, but similar
    // has to be done for yeks of all the other nids involved
    records.push({ yek, lav })
  }

  await store.set(records)
  return { nid: node.nid }
}

async function getNode({
  store,
  nid,
}: {
  store: YekLavStore
  nid: Nid
}): Promise<TNode> {
  const yek: NidYek = { yek: { kind: 'nid', key: nid } }
  const lav: NidLav | undefined = await store.get(yek)
  if (lav == null) {
    throw new Error(`Failed to get node ${nid} because it wasn't found`)
  }
  const value: TNodeJson = lav.lav.value
  return NodeUtil.fromJson(value)
}

async function getNodeBatch(
  store: YekLavStore,
  req: NodeBatchRequestBody
): Promise<NodeBatch> {
  const yeks: NidYek[] = req.nids.map((nid: Nid): NidYek => {
    return { yek: { kind: 'nid', key: nid } }
  })
  const lavs: NidLav[] = await store.get(yeks)
  return { nodes: lavs.map((lav: NidLav) => NodeUtil.fromJson(lav.lav.value)) }
}

async function updateNode(
  store: YekLavStore,
  args: { nid: Nid } & NodePatchRequest
): Promise<Ack> {
  const yek: NidYek = { yek: { kind: 'nid', key: args.nid } }
  const lav: NidLav | undefined = await store.get(yek)
  if (lav == null) {
    throw new Error(`Failed to update node ${args.nid} because it wasn't found`)
  }
  const value: TNodeJson = lav.lav.value
  value.text = args.text != null ? args.text : value.text
  value.index_text =
    args.index_text != null ? args.index_text : value.index_text
  if (!args.preserve_update_time) {
    value.updated_at = unixtime.now()
  }
  await store.set([{ yek, lav }])
  return { ack: true }
}

export function makeLocalStorageApi(
  browserStore: browser.Storage.StorageArea
): StorageApi {
  const store = new YekLavStore(browserStore)

  const throwUnimplementedError = (endpoint: string) => {
    return (..._: any[]): never => {
      throw new Error(
        `Attempted to call an ${endpoint} endpoint of local StorageApi which hasn't been implemented yet`
      )
    }
  }

  return {
    node: {
      get: ({ nid }: { nid: string; signal?: AbortSignal }) =>
        getNode({ store, nid }),
      update: (
        args: { nid: string } & NodePatchRequest,
        _signal?: AbortSignal
      ) => updateNode(store, args),
      create: (args: CreateNodeArgs, _signal?: AbortSignal) =>
        createNode(store, args),
      // TODO[snikitin@outlook.com] Local-hosted slicing implementation is a
      // problem because the datacenter-hosted version depends entirely on
      // time range search which is easy with in SQL, but with a KV-store
      // requires to load all nodes from memory on every "iteration"
      slice: throwUnimplementedError('node.slice'),
      delete: throwUnimplementedError('node.delete'),
      bulkDelete: throwUnimplementedError('node.bulkdDelete'),
      batch: {
        get: (req: NodeBatchRequestBody, _signal?: AbortSignal) =>
          getNodeBatch(store, req),
      },
      url: throwUnimplementedError('node.url'),
    },
    // TODO[snikitin@outlook.com] At the time of this writing blob.upload and
    // blob_index.build are used together to create a single searchable blob node.
    // blob.upload is easy to implement for local storage while blob_index.build
    // is more difficult. Given how important search is for Mazed goals at the
    // time of writing, it makes little sense to implement any of them until
    // blob_index.build is usable.
    blob: {
      upload: throwUnimplementedError('blob.upload'),
      sourceUrl: throwUnimplementedError('blob.sourceUrl'),
    },
    blob_index: {
      build: throwUnimplementedError('blob_index.build'),
      cfg: {
        supportsMime: (_mimeType: MimeType) => false,
      },
    },
    edge: {
      // create: createEdge,
      // get: getNodeAllEdges,
      // sticky: switchEdgeStickiness,
      // delete: deleteEdge,
    },
    activity: {
      external: {
        // add: addExternalUserActivity,
        // get: getExternalUserActivity,
      },
      association: {
        // record: recordExternalAssociation,
        // get: getExternalAssociation,
      },
    },
    external: {
      ingestion: {
        // get: getUserIngestionProgress,
        // advance: advanceUserIngestionProgress,
      },
    },
  }
}
