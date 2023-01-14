/**
 * An implementation of @see smuggler-api.StorageApi that persists the data
 * in a storage only available to browser extensions (most likely - locally on device).
 *
 * It is intended to work in all browser extension contexts (such as background,
 * content etc).
 * See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
 * for more information.
 *
 * NOTE: At the time of this writing dev tools of some browsers (including the
 * Chromium-based ones) do not include anything that would allow to inspect the contents
 * of the underlying storage. See https://stackoverflow.com/a/27432365/3375765
 * for workarounds.
 */

import type {
  Ack,
  AddUserActivityRequest,
  AddUserExternalAssociationRequest,
  AdvanceExternalPipelineIngestionProgress,
  EdgeCreateArgs,
  NodeCreateArgs,
  Eid,
  NewNodeResponse,
  Nid,
  NodeBatch,
  NodeBatchRequestBody,
  NodeEdges,
  NodePatchRequest,
  OriginId,
  StorageApi,
  TEdge,
  TEdgeJson,
  TNode,
  TNodeJson,
  TotalUserActivity,
  UserExternalPipelineId,
  UserExternalPipelineIngestionProgress,
  NodeGetArgs,
  NodeGetByOriginArgs,
  NodeUpdateArgs,
  EdgeGetArgs,
  ActivityExternalAddArgs,
  ActivityExternalGetArgs,
  ActivityAssociationRecordArgs,
  ActivityAssociationGetArgs,
  ExternalIngestionAdvanceArgs,
  ExternalIngestionGetArgs,
  NodeGetAllNidsArgs,
} from 'smuggler-api'
import { INodeIterator, NodeUtil, EdgeUtil, NodeType } from 'smuggler-api'
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

type AllNidsYek = GenericYek<'all-nids', undefined>
type AllNidsLav = GenericLav<'all-nids', Nid[]>

type NidToNodeYek = GenericYek<'nid->node', Nid>
type NidToNodeLav = GenericLav<'nid->node', TNodeJson>

type OriginToNidYek = GenericYek<'origin->nid', OriginId>
type OriginToNidLav = GenericLav<'origin->nid', Nid[]>

type NidToEdgeYek = GenericYek<'nid->edge', Nid>
type NidToEdgeLav = GenericLav<'nid->edge', TEdgeJson[]>

type OriginToActivityYek = GenericYek<'origin->activity', OriginId>
type OriginToActivityLav = GenericLav<'origin->activity', TotalUserActivity>

type ExtPipelineYek = GenericYek<'ext-pipe->progress', UserExternalPipelineId>
type ExtPipelineLav = GenericLav<
  'ext-pipe->progress',
  Omit<UserExternalPipelineIngestionProgress, 'epid'>
>

type Yek =
  | AllNidsYek
  | NidToNodeYek
  | OriginToNidYek
  | NidToEdgeYek
  | OriginToActivityYek
  | ExtPipelineYek
type Lav =
  | AllNidsLav
  | NidToNodeLav
  | OriginToNidLav
  | NidToEdgeLav
  | OriginToActivityLav
  | ExtPipelineLav

type YekLav = { yek: Yek; lav: Lav }

function isOfArrayKind(
  lav: Lav
): lav is OriginToNidLav | NidToEdgeLav | AllNidsLav {
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

  // TODO[snikitin@outlook.com] Add a note that the code that uses this
  // method should try to combine everything it needs to do into ONE
  // call to set() in hopes to retain at least some data consistency
  // guarantees.
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
      if (Object.keys(records).indexOf(key) !== -1) {
        throw new Error(`Attempted to set more than 1 value for key '${key}'`)
      }
      records[key] = item.lav
    }
    return this.store.set(records)
  }

  get(yek: AllNidsYek): Promise<AllNidsLav | undefined>
  get(yek: NidToNodeYek): Promise<NidToNodeLav | undefined>
  get(yek: OriginToNidYek): Promise<OriginToNidLav | undefined>
  get(yek: NidToEdgeYek): Promise<NidToEdgeLav | undefined>
  get(yek: NidToNodeYek[]): Promise<NidToNodeLav[]>
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
    yek: AllNidsYek,
    lav: AllNidsLav
  ): Promise<{
    yek: AllNidsYek
    lav: AllNidsLav
  }>
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
      case 'all-nids':
        return 'all-nids'
      case 'nid->node':
        return 'nid->node:' + yek.yek.key
      case 'origin->nid':
        return 'origin->nid:' + yek.yek.key.id
      case 'nid->edge':
        return 'nid->edge:' + yek.yek.key
      case 'origin->activity':
        return 'origin->activity:' + yek.yek.key.id
      case 'ext-pipe->progress':
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
  return base32Encode(array, 'Crockford').toLowerCase()
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
  args: NodeCreateArgs
): Promise<NewNodeResponse> {
  // TODO[snikitin@outlook.com] Below keys must become functional somehow.
  // const _created_via: NodeCreatedVia | undefined = args.created_via

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

  let records: YekLav[] = [
    await store.prepareAppend(
      { yek: { kind: 'all-nids', key: undefined } },
      { lav: { kind: 'all-nids', value: [node.nid] } }
    ),
    {
      yek: { yek: { kind: 'nid->node', key: node.nid } },
      lav: { lav: { kind: 'nid->node', value: node } },
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

async function getNode(
  store: YekLavStore,
  { nid }: NodeGetArgs
): Promise<TNode> {
  const yek: NidToNodeYek = { yek: { kind: 'nid->node', key: nid } }
  const lav: NidToNodeLav | undefined = await store.get(yek)
  if (lav == null) {
    throw new Error(`Failed to get node ${nid} because it wasn't found`)
  }
  const value: TNodeJson = lav.lav.value
  return NodeUtil.fromJson(value)
}

async function getNodesByOrigin(
  store: YekLavStore,
  { origin }: NodeGetByOriginArgs
): Promise<TNode[]> {
  const yek: OriginToNidYek = { yek: { kind: 'origin->nid', key: origin } }
  const lav: OriginToNidLav | undefined = await store.get(yek)
  if (lav == null) {
    return []
  }
  const value: Nid[] = lav.lav.value
  const nidYeks: NidToNodeYek[] = value.map((nid: Nid): NidToNodeYek => {
    return { yek: { kind: 'nid->node', key: nid } }
  })
  const nidLavs: NidToNodeLav[] = await store.get(nidYeks)
  return nidLavs.map((lav: NidToNodeLav) => NodeUtil.fromJson(lav.lav.value))
}

async function getNodeBatch(
  store: YekLavStore,
  args: NodeBatchRequestBody
): Promise<NodeBatch> {
  const yeks: NidToNodeYek[] = args.nids.map((nid: Nid): NidToNodeYek => {
    return { yek: { kind: 'nid->node', key: nid } }
  })
  const lavs: NidToNodeLav[] = await store.get(yeks)
  return {
    nodes: lavs.map((lav: NidToNodeLav) => NodeUtil.fromJson(lav.lav.value)),
  }
}

async function updateNode(
  store: YekLavStore,
  args: NodeUpdateArgs
): Promise<Ack> {
  const yek: NidToNodeYek = { yek: { kind: 'nid->node', key: args.nid } }
  const lav: NidToNodeLav | undefined = await store.get(yek)
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

class Iterator implements INodeIterator {
  private store: YekLavStore
  private nids: Promise<Nid[]>
  private index: number

  constructor(store: YekLavStore) {
    this.store = store
    this.index = 0

    const yek: AllNidsYek = {
      yek: { kind: 'all-nids', key: undefined },
    }
    this.nids = store
      .get(yek)
      .then((lav: AllNidsLav | undefined) => lav?.lav.value ?? [])
  }

  async next(): Promise<TNode | null> {
    const nids = await this.nids
    if (this.index >= nids.length) {
      return null
    }
    const nid: Nid = nids[this.index]
    const yek: NidToNodeYek = { yek: { kind: 'nid->node', key: nid } }
    const lav: NidToNodeLav | undefined = await this.store.get(yek)
    if (lav == null) {
      throw new Error(`Failed to find node for nid ${nid}`)
    }
    ++this.index
    return NodeUtil.fromJson(lav.lav.value)
  }
  total(): number {
    return this.index
  }
  abort(): void {
    this.index = 0
    this.nids = Promise.resolve([])
  }
}

async function createEdge(
  store: YekLavStore,
  args: EdgeCreateArgs
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
  { nid }: EdgeGetArgs
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
  { origin, activity }: ActivityExternalAddArgs
): Promise<TotalUserActivity> {
  const total: TotalUserActivity = await getExternalUserActivity(store, {
    origin,
  })
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
  { origin }: ActivityExternalGetArgs
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
  { epid }: ExternalIngestionGetArgs
): Promise<UserExternalPipelineIngestionProgress> {
  const yek: ExtPipelineYek = {
    yek: { kind: 'ext-pipe->progress', key: epid },
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
  { epid, new_progress }: ExternalIngestionAdvanceArgs
): Promise<Ack> {
  const progress: UserExternalPipelineIngestionProgress =
    await getUserIngestionProgress(store, { epid })
  progress.ingested_until = new_progress.ingested_until

  const yek: ExtPipelineYek = {
    yek: { kind: 'ext-pipe->progress', key: epid },
  }
  const lav: ExtPipelineLav = {
    lav: { kind: 'ext-pipe->progress', value: progress },
  }
  await store.set([{ yek, lav }])
  return { ack: true }
}

export async function getAllNids(
  store: YekLavStore,
  _args: NodeGetAllNidsArgs
): Promise<Nid[]> {
  const yek: AllNidsYek = { yek: { kind: 'all-nids', key: undefined } }
  const lav: AllNidsLav | undefined = await store.get(yek)
  if (lav == null) {
    return []
  }
  const value: Nid[] = lav.lav.value
  return value
}

export function makeBrowserExtStorageApi(
  browserStore: browser.Storage.StorageArea
): StorageApi {
  const store = new YekLavStore(browserStore)

  const throwUnimplementedError = (endpoint: string) => {
    return (..._: any[]): never => {
      throw new Error(
        `Attempted to call an ${endpoint} endpoint of browser ` +
          "extension's local StorageApi which hasn't been implemented yet"
      )
    }
  }

  return {
    node: {
      get: (args: NodeGetArgs) => getNode(store, args),
      getByOrigin: (args: NodeGetByOriginArgs) => getNodesByOrigin(store, args),
      getAllNids: (args: NodeGetAllNidsArgs) => getAllNids(store, args),
      update: (args: NodeUpdateArgs) => updateNode(store, args),
      create: (args: NodeCreateArgs) => createNode(store, args),
      iterate: () => new Iterator(store),
      delete: throwUnimplementedError('node.delete'),
      bulkDelete: throwUnimplementedError('node.bulkdDelete'),
      batch: {
        get: (args: NodeBatchRequestBody) => getNodeBatch(store, args),
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
      create: (args: EdgeCreateArgs) => createEdge(store, args),
      get: (args: EdgeGetArgs) => getNodeAllEdges(store, args),
      sticky: throwUnimplementedError('edge.sticky'),
      delete: throwUnimplementedError('edge.delete'),
    },
    activity: {
      external: {
        add: (args: ActivityExternalAddArgs) =>
          addExternalUserActivity(store, args),
        get: (args: ActivityExternalGetArgs) =>
          getExternalUserActivity(store, args),
      },
      association: {
        // TODO[snikitin@outlook.com] Replace stubs with real implementation
        record: (_args: ActivityAssociationRecordArgs) =>
          Promise.resolve({ ack: true }),
        get: (_args: ActivityAssociationGetArgs) =>
          Promise.resolve({ from: [], to: [] }),
      },
    },
    external: {
      ingestion: {
        get: (args: ExternalIngestionGetArgs) =>
          getUserIngestionProgress(store, args),
        advance: (args: ExternalIngestionAdvanceArgs) =>
          advanceUserIngestionProgress(store, args),
      },
    },
  }
}
