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
  AddUserActivityRequest,
  AddUserExternalAssociationRequest,
  AdvanceExternalPipelineIngestionProgress,
  CreateEdgeArgs,
  CreateNodeArgs,
  EdgeUtil,
  Eid,
  NewNodeResponse,
  Nid,
  NodeBatch,
  NodeBatchRequestBody,
  NodeCreatedVia,
  NodeEdges,
  NodePatchRequest,
  NodeUtil,
  OriginId,
  StorageApi,
  TEdge,
  TEdgeJson,
  TNode,
  TNodeJson,
  INodeIterator,
  TotalUserActivity,
  UserExternalPipelineId,
  UserExternalPipelineIngestionProgress,
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

type OriginToActivityYek = GenericYek<'origin->activity', OriginId>
type OriginToActivityLav = GenericLav<'origin->activity', TotalUserActivity>

type ExtPipelineYek = GenericYek<'ext-pipe', UserExternalPipelineId>
type ExtPipelineLav = GenericLav<
  'ext-pipe',
  Omit<UserExternalPipelineIngestionProgress, 'epid'>
>

type Yek =
  | NidYek
  | OriginToNidYek
  | NidToEdgeYek
  | OriginToActivityYek
  | ExtPipelineYek
type Lav =
  | NidLav
  | OriginToNidLav
  | NidToEdgeLav
  | OriginToActivityLav
  | ExtPipelineLav

type YekLav = { yek: Yek; lav: Lav }

function isOfArrayKind(lav: Lav): lav is OriginToNidLav | NidToEdgeLav {
  return Array.isArray(lav.lav.value)
}

// TODO[snikitin@outlook.com] Describe that the purpose of this wrapper is to
// add a bit of ORM-like typesafety to browser.Storage.StorageArea.
// Without this it's very difficult to keep track of what the code is doing
// and what it's supposed to do
class YekLavStore {
  private store: browser.Storage.StorageArea

  constructor(store: browser.Storage.StorageArea) {
    this.store = store
  }

  set(items: YekLav[]): Promise<void> {
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
  get(yek: OriginToActivityYek): Promise<OriginToActivityLav | undefined>
  get(yek: ExtPipelineYek): Promise<ExtPipelineLav | undefined>
  get(yek: Yek): Promise<Lav | undefined>
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

  // TODO[snikitin@outlook.com] Explain that this method is a poor man's attempt
  // to increase atomicity of data insertion
  async prepareAppend(
    yek: OriginToNidYek,
    lav: OriginToNidLav
  ): Promise<{
    yek: OriginToNidYek
    lav: OriginToNidLav
  }>
  async prepareAppend(
    yek: NidToEdgeYek,
    lav: NidToEdgeLav
  ): Promise<{
    yek: NidToEdgeYek
    lav: NidToEdgeLav
  }>
  async prepareAppend(yek: Yek, appended_lav: Lav): Promise<YekLav> {
    if (yek.yek.kind !== appended_lav.lav.kind) {
      throw new Error(
        `Attempted to append a key/value pair of mismatching kinds: '${yek.yek.kind}' !== '${appended_lav.lav.kind}'`
      )
    }
    const lav = await this.get(yek)
    if (lav != null && !isOfArrayKind(lav)) {
      throw new Error(`prepareAppend only works/makes sense for arrays`)
    }
    const value = lav?.lav.value ?? []
    // TODO[snikitin@outlook.com] I'm sure it's possible to convince Typescript
    // that below is safe, but don't know how
    return {
      yek,
      // @ts-ignore Type '{...}' is not assignable to type 'Lav'
      lav: {
        lav: {
          kind: yek.yek.kind,
          // @ts-ignore Each member of the union type has signatures, but none of those
          // signatures are compatible with each other
          value: value.concat(appended_lav.lav.value),
        },
      },
    }
  }

  private stringify(yek: Yek): string {
    switch (yek.yek.kind) {
      case 'nid':
        return 'nid:' + yek.yek.key
      case 'origin->nid':
        return 'origin->nid:' + yek.yek.key.id
      case 'nid->edge':
        return 'nid->edge:' + yek.yek.key
      case 'origin->activity':
        return 'origin->activity:' + yek.yek.key.id
      case 'ext-pipe':
        return 'ext-pipe:' + yek.yek.key.pipeline_key
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
    const lav: OriginToNidLav = {
      lav: { kind: 'origin->nid', value: [node.nid] },
    }
    records.push(await store.prepareAppend(yek, lav))
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

async function createEdge(
  store: YekLavStore,
  args: CreateEdgeArgs
): Promise<TEdge> {
  // TODO[snikitin@outlook.com] Evaluate if ownership support is needed
  // and implement if yes
  const owned_by = 'todo'

  const createdAt: number = unixtime.now()
  const edge: TEdgeJson = {
    eid: generateEid(),
    from_nid: args.from,
    to_nid: args.to,
    crtd: createdAt,
    upd: createdAt,
    is_sticky: false,
    owned_by,
  }

  const items: YekLav[] = []
  {
    const yek: NidToEdgeYek = { yek: { kind: 'nid->edge', key: args.from } }
    const lav: NidToEdgeLav = { lav: { kind: 'nid->edge', value: [edge] } }
    items.push(await store.prepareAppend(yek, lav))
  }
  {
    const reverseEdge: TEdgeJson = {
      ...edge,
      from_nid: args.to,
      to_nid: args.from,
    }
    const yek: NidToEdgeYek = { yek: { kind: 'nid->edge', key: args.to } }
    const lav: NidToEdgeLav = {
      lav: { kind: 'nid->edge', value: [reverseEdge] },
    }
    items.push(await store.prepareAppend(yek, lav))
  }
  await store.set(items)
  return EdgeUtil.fromJson(edge)
}

async function getNodeAllEdges(
  store: YekLavStore,
  nid: string
): Promise<NodeEdges> {
  const yek: NidToEdgeYek = { yek: { kind: 'nid->edge', key: nid } }
  const lav: NidToEdgeLav | undefined = await store.get(yek)
  const ret: NodeEdges = { from_edges: [], to_edges: [] }
  if (lav == null) {
    return ret
  }
  for (const edge of lav.lav.value) {
    if (edge.to_nid === nid) {
      ret.from_edges.push(EdgeUtil.fromJson(edge))
    } else {
      ret.to_edges.push(EdgeUtil.fromJson(edge))
    }
  }
  return ret
}

async function addExternalUserActivity(
  store: YekLavStore,
  origin: OriginId,
  activity: AddUserActivityRequest
): Promise<TotalUserActivity> {
  const total: TotalUserActivity = await getExternalUserActivity(store, origin)
  if ('visit' in activity) {
    if (activity.visit == null) {
      return total
    }
    total.visits = total.visits.concat(activity.visit.visits)
    if (activity.visit.reported_by != null) {
      throw new Error(
        `activity.external.add does not implement support for visit.reported_by yet`
      )
    }
  } else if ('attention' in activity) {
    if (activity.attention == null) {
      return total
    }
    // TODO[snikitin@outlook.com] What to do with activity.attention.timestamp here?
    total.seconds_of_attention += activity.attention.seconds
  }

  const yek: OriginToActivityYek = {
    yek: { kind: 'origin->activity', key: origin },
  }
  const lav: OriginToActivityLav = {
    lav: { kind: 'origin->activity', value: total },
  }
  await store.set([{ yek, lav }])
  return total
}

async function getExternalUserActivity(
  store: YekLavStore,
  origin: OriginId
): Promise<TotalUserActivity> {
  const yek: OriginToActivityYek = {
    yek: { kind: 'origin->activity', key: origin },
  }
  const lav: OriginToActivityLav | undefined = await store.get(yek)
  if (lav == null) {
    return {
      visits: [],
      seconds_of_attention: 0,
    }
  }
  const value: TotalUserActivity = lav.lav.value
  return value
}

async function getUserIngestionProgress(
  store: YekLavStore,
  epid: UserExternalPipelineId
): Promise<UserExternalPipelineIngestionProgress> {
  const yek: ExtPipelineYek = {
    yek: { kind: 'ext-pipe', key: epid },
  }
  const lav: ExtPipelineLav | undefined = await store.get(yek)
  if (lav == null) {
    return {
      epid,
      ingested_until: 0,
    }
  }
  const value: UserExternalPipelineIngestionProgress = {
    epid,
    ...lav.lav.value,
  }
  return value
}

async function advanceUserIngestionProgress(
  store: YekLavStore,
  epid: UserExternalPipelineId,
  new_progress: AdvanceExternalPipelineIngestionProgress
): Promise<Ack> {
  const progress: UserExternalPipelineIngestionProgress =
    await getUserIngestionProgress(store, epid)
  progress.ingested_until = new_progress.ingested_until

  const yek: ExtPipelineYek = {
    yek: { kind: 'ext-pipe', key: epid },
  }
  const lav: ExtPipelineLav = {
    lav: { kind: 'ext-pipe', value: progress },
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
      getByOrigin: throwUnimplementedError('node.getByOrigin'),
      update: (
        args: { nid: string } & NodePatchRequest,
        _signal?: AbortSignal
      ) => updateNode(store, args),
      create: (args: CreateNodeArgs, _signal?: AbortSignal) =>
        createNode(store, args),
      iterate: throwUnimplementedError('node.iterate'),
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
      create: (args: CreateEdgeArgs) => createEdge(store, args),
      get: (nid: string, _signal?: AbortSignal) => getNodeAllEdges(store, nid),
      sticky: throwUnimplementedError('edge.sticky'),
      delete: throwUnimplementedError('edge.delete'),
    },
    activity: {
      external: {
        add: (
          origin: OriginId,
          activity: AddUserActivityRequest,
          _signal?: AbortSignal
        ) => addExternalUserActivity(store, origin, activity),
        get: (origin: OriginId, _signal?: AbortSignal) =>
          getExternalUserActivity(store, origin),
      },
      association: {
        // TODO[snikitin@outlook.com] Replace stubs with real implementation
        record: (
          _origin: {
            from: OriginId
            to: OriginId
          },
          _body: AddUserExternalAssociationRequest,
          _signal?: AbortSignal
        ) => Promise.resolve({ ack: true }),
        get: (
          {}: {
            origin: OriginId
          },
          _signal?: AbortSignal
        ) => Promise.resolve({ from: [], to: [] }),
      },
    },
    external: {
      ingestion: {
        get: (epid: UserExternalPipelineId, _signal?: AbortSignal) =>
          getUserIngestionProgress(store, epid),
        advance: (
          epid: UserExternalPipelineId,
          new_progress: AdvanceExternalPipelineIngestionProgress,
          _signal?: AbortSignal
        ) => advanceUserIngestionProgress(store, epid, new_progress),
      },
    },
  }
}
