import {
  AccountInfo,
  Ack,
  AddUserActivityRequest,
  AddUserExternalAssociationRequest,
  AdvanceExternalPipelineIngestionProgress,
  EdgeAttributes,
  GenerateBlobIndexResponse,
  GetUserExternalAssociationsResponse,
  NewNodeResponse,
  Nid,
  NodeAttrsSearchRequest,
  NodeAttrsSearchResponse,
  NodeBatch,
  NodeCreateRequestBody,
  NodeCreatedVia,
  NodeEdges,
  NodeExtattrs,
  NodeIndexText,
  NodePatchRequest,
  NodeTextData,
  NodeType,
  OriginId,
  TEdge,
  TNode,
  TNodeJson,
  TotalUserActivity,
  UploadMultipartRequestBody as UploadMultipartQuery,
  UploadMultipartResponse,
  UserBadge,
  UserExternalPipelineId,
  UserExternalPipelineIngestionProgress,
} from './types'

import { makeUrl } from './api_url'

import { TNodeSliceIterator, GetNodesSliceFn } from './node_slice_iterator'

import { genOriginId, Mime, stabiliseUrlForOriginId } from 'armoury'
import type { Optional } from 'armoury'
import { MimeType, log } from 'armoury'

import lodash from 'lodash'
import moment from 'moment'
import { StatusCode } from './status_codes'
import { authCookie } from './auth/cookie'

const kHeaderCreatedAt = 'x-created-at'
const kHeaderLastModified = 'last-modified'

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

export type CreateNodeArgs = {
  text: NodeTextData
  from_nid?: string[]
  to_nid?: string[]
  index_text?: NodeIndexText
  extattrs?: NodeExtattrs
  ntype?: NodeType
  origin?: OriginId
  created_via?: NodeCreatedVia
  created_at?: Date
}

async function createNode(
  {
    text,
    from_nid,
    to_nid,
    index_text,
    extattrs,
    ntype,
    origin,
    created_via,
    created_at,
  }: CreateNodeArgs,
  signal?: AbortSignal
): Promise<NewNodeResponse> {
  signal = signal || undefined
  const query = {
    from: from_nid || undefined,
    to: to_nid || undefined,
    ntype,
  }
  const body: NodeCreateRequestBody = {
    text,
    index_text,
    extattrs,
    origin,
    created_via,
  }
  const headers: Record<string, string> = { 'Content-type': MimeType.JSON }
  if (created_at != null) {
    headers['X-Created-At'] = created_at.toUTCString()
  }
  const resp = await fetch(makeUrl('node/new', query), {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

function lookupKeyOf(args: CreateNodeArgs): NodeLookupKey | undefined {
  // TODO[snikitin@outlook.com]: This ideally should match with TNode.isWebBookmark(),
  // TNode.isWebQuote() etc but unclear how to reliably do so.
  if (args.extattrs?.web?.url) {
    return { webBookmark: { url: args.extattrs.web.url } }
  } else if (args.extattrs?.web_quote?.url) {
    return { webQuote: { url: args.extattrs.web_quote.url } }
  }
  return undefined
}

async function createOrUpdateNode(
  args: CreateNodeArgs,
  signal?: AbortSignal
): Promise<NewNodeResponse> {
  const lookupKey = lookupKeyOf(args)
  if (!lookupKey || !isUniqueLookupKey(lookupKey)) {
    throw new Error(
      `Attempt was made to create a node or, if it exists, update it, ` +
        `but the input node used look up key ${JSON.stringify(lookupKey)} ` +
        `that is not unique, which makes it impossible to correctly handle the 'update' case`
    )
  }
  const existingNode: TNode | undefined = await lookupNodes(lookupKey)

  if (!existingNode) {
    return createNode(args, signal)
  }

  const diff = describeWhatWouldPreventNodeUpdate(args, existingNode)
  if (diff) {
    throw new Error(
      `Failed to update node ${existingNode.nid} because some specified fields ` +
        `do not support update:\n${diff}`
    )
  }

  const updateArgs: UpdateNodeArgs = {
    nid: existingNode.nid,
    text: args.text,
    index_text: args.index_text,
  }

  const resp = await updateNode(updateArgs, signal)
  if (!resp.ok) {
    throw _makeResponseError(resp, `Failed to update node ${existingNode.nid}`)
  }
  return {
    nid: existingNode.nid,
  }
}

/**
 * At the time of this writing some datapoints that can be specified at
 * node creation can't be modified at node update due to API differences
 * (@see CreateNodeArgs and @see UpdateNodeArgs).
 * This presents a problem for @see createOrUpdate because some of the datapoints
 * caller passed in will be ignored in 'update' case, which is not obvious
 * and would be unexpected by the caller.
 * As a hack this helper tries to check if these datapoints are actually
 * different from node's current state. If they are the same then update will
 * not result in anything unexpected.
 */
function describeWhatWouldPreventNodeUpdate(args: CreateNodeArgs, node: TNode) {
  let diff = ''
  const extattrsFieldsOfLittleConsequence = ['description']
  const updatableExtattrsFields = ['text', 'index_text']
  for (const field in args.extattrs) {
    const isTargetField = (v: string) => v === field
    const isNonUpdatable =
      updatableExtattrsFields.findIndex(isTargetField) === -1
    const isOfLittleConsequence =
      extattrsFieldsOfLittleConsequence.findIndex(isTargetField) !== -1
    if (!isNonUpdatable || isOfLittleConsequence) {
      continue
    }
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'NodeExtattrs'
    const lhs = args.extattrs[field]
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'NodeExtattrs'
    const rhs = node.extattrs[field]
    if (!lodash.isEqual(lhs, rhs)) {
      diff +=
        `\n\textattrs.${field} - ` +
        `${JSON.stringify(lhs)} vs ${JSON.stringify(rhs)}`
    }
  }
  if (args.ntype !== node.ntype) {
    diff += `\n\tntype - ${JSON.stringify(args.ntype)} vs ${JSON.stringify(
      node.ntype
    )}`
  }
  // At the time of this writing some datapoints that can be set on
  // creation of a node do not get sent back when nodes are later retrieved
  // from smuggler. That makes it difficult to verify if values in 'args' differ
  // from what's stored on smuggler side or not. A conservative validation
  // strategy is used ("if a value is set, treat is as an error") to cut corners.
  if (args.from_nid) {
    diff += `\n\tfrom_nid - ${args.from_nid} vs (data not exposed via smuggler)`
  }
  if (args.to_nid) {
    diff += `\n\tto_nid - ${args.to_nid} vs (data not exposed via smuggler)`
  }

  if (!diff) {
    return null
  }

  return `[what] - [attempted update arg] vs [existing node value]: ${diff}`
}

/**
 * Lookup all the nodes that match a given key. For unique lookup keys either
 * 0 or 1 nodes will be returned. For non-unique more than 1 node can be returned.
 */
async function lookupNodes(
  key: UniqueNodeLookupKey,
  signal?: AbortSignal
): Promise<TNode | undefined>
async function lookupNodes(
  key: NonUniqueNodeLookupKey,
  signal?: AbortSignal
): Promise<TNode[]>
async function lookupNodes(key: NodeLookupKey, signal?: AbortSignal) {
  const SLICE_ALL = {
    start_time: 0, // since the beginning of time
    bucket_time_size: 366 * 24 * 60 * 60,
  }
  if ('nid' in key) {
    return getNode({ nid: key.nid, signal })
  } else if ('webBookmark' in key) {
    const { id, stableUrl } = genOriginId(key.webBookmark.url)
    const query = { ...SLICE_ALL, origin: { id } }
    const iter = smuggler.node.slice(query)

    for (let node = await iter.next(); node != null; node = await iter.next()) {
      const nodeUrl = node.extattrs?.web?.url
      if (nodeUrl && stabiliseUrlForOriginId(nodeUrl) === stableUrl) {
        return node
      }
    }
    return undefined
  } else if ('webQuote' in key) {
    const { id, stableUrl } = genOriginId(key.webQuote.url)
    const query = { ...SLICE_ALL, origin: { id } }
    const iter = smuggler.node.slice(query)

    const nodes: TNode[] = []
    for (let node = await iter.next(); node != null; node = await iter.next()) {
      if (node.isWebQuote() && node.extattrs?.web_quote) {
        if (
          stabiliseUrlForOriginId(node.extattrs.web_quote.url) === stableUrl
        ) {
          nodes.push(node)
        }
      }
    }
    return nodes
  } else if ('url' in key) {
    const { id, stableUrl } = genOriginId(key.url)
    const query = { ...SLICE_ALL, origin: { id } }
    const iter = smuggler.node.slice(query)

    const nodes: TNode[] = []
    for (let node = await iter.next(); node != null; node = await iter.next()) {
      if (node.isWebBookmark() && node.extattrs?.web) {
        if (stabiliseUrlForOriginId(node.extattrs.web.url) === stableUrl) {
          nodes.push(node)
        }
      }
    }
    return nodes
  }

  throw new Error(`Failed to lookup nodes, unsupported key ${key}`)
}

async function uploadFiles(
  files: File[],
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  createdVia: NodeCreatedVia,
  signal?: AbortSignal
): Promise<UploadMultipartResponse> {
  const query: UploadMultipartQuery = { created_via: createdVia }
  if (from_nid) {
    query.from = from_nid
  } else if (to_nid) {
    query.to = to_nid
  }
  const value = new FormData()
  files.forEach((file) => value.append('file', file, file.name))
  const resp = await fetch(makeUrl('/blob/new', query), {
    method: 'POST',
    body: value,
    signal,
  })
  if (!resp.ok) {
    throw _makeResponseError(resp)
  }
  return await resp.json()
}

async function buildFilesSearchIndex(
  files: File[],
  signal?: AbortSignal
): Promise<GenerateBlobIndexResponse> {
  const value = new FormData()
  files.forEach((file) => {
    value.append('file', file, file.name)
  })
  const resp = await fetch(makeUrl('/blob-index'), {
    method: 'POST',
    body: value,
    signal,
  })
  if (!resp.ok) {
    throw _makeResponseError(resp)
  }
  return await resp.json()
}

function mimeTypeIsSupportedByBuildIndex(mimeType: MimeType) {
  return Mime.isImage(mimeType)
}

function makeBlobSourceUrl(nid: string): string {
  return makeUrl(`/blob/${nid}`)
}

async function deleteNode({
  nid,
  signal,
}: {
  nid: string
  signal?: AbortSignal
}): Promise<Ack> {
  verifyIsNotNull(nid)
  const resp = await fetch(makeUrl(`/node/${nid}`), {
    method: 'DELETE',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

async function bulkDeleteNodes({
  createdVia,
  signal,
}: {
  createdVia: NodeCreatedVia
  signal?: AbortSignal
}): Promise<number /* number of nodes deleted */> {
  const headers = {
    'Content-type': MimeType.JSON,
  }
  const resp = await fetch(makeUrl(`/node`), {
    method: 'DELETE',
    body: JSON.stringify({ createdVia }),
    headers,
    signal,
  })
  if (resp.ok) {
    const content = await resp.json()
    return content.num_deleted_nodes
  }
  throw _makeResponseError(resp)
}

async function getNode({
  nid,
  signal,
}: {
  nid: string
  signal?: AbortSignal
}): Promise<TNode> {
  const res = await fetch(makeUrl(`/node/${nid}`), { method: 'GET', signal })
  if (!res.ok) {
    throw _makeResponseError(res)
  }
  const {
    text,
    ntype,
    extattrs = null,
    index_text = null,
    meta = null,
  } = await res.json()
  const secret_id = null
  const success = true
  const node = new TNode(
    nid,
    ntype,
    text as NodeTextData,
    moment(res.headers.get(kHeaderCreatedAt)),
    moment(res.headers.get(kHeaderLastModified)),
    meta,
    extattrs ? extattrs : null,
    index_text,
    { secret_id, success }
  )
  return node
}

type NodePatchRequestBody = {
  nids: Nid[]
}

async function getNodeBatch(
  req: NodePatchRequestBody,
  signal?: AbortSignal
): Promise<NodeBatch> {
  const res = await fetch(makeUrl(`/node-batch-get`), {
    method: 'POST',
    signal,
    body: JSON.stringify(req),
    headers: { 'Content-type': MimeType.JSON },
  })
  if (!res.ok) {
    throw _makeResponseError(res)
  }
  const { nodes } = await res.json()
  return {
    nodes: nodes.map(
      ({
        nid,
        ntype,
        text,
        extattrs,
        index_text,
        created_at,
        updated_at,
        meta,
      }: TNodeJson) =>
        TNode.fromJson({
          nid,
          ntype,
          text,
          extattrs,
          index_text,
          created_at,
          updated_at,
          meta,
        })
    ),
  }
}

type UpdateNodeArgs = {
  nid: string
  text?: NodeTextData
  index_text?: NodeIndexText
  preserve_update_time?: boolean
}

async function updateNode(args: UpdateNodeArgs, signal?: AbortSignal) {
  const { nid, text, index_text, preserve_update_time } = args
  const headers = {
    'Content-type': MimeType.JSON,
  }
  const request: NodePatchRequest = {
    text,
    index_text,
    preserve_update_time,
  }
  return fetch(makeUrl(`/node/${nid}`), {
    method: 'PATCH',
    body: JSON.stringify(request),
    headers,
    signal,
  })
}

async function getAuth({
  signal,
}: {
  signal?: AbortSignal
}): Promise<AccountInfo> {
  const resp = await fetch(makeUrl('/auth'), { method: 'GET', signal })
  if (!resp.ok) {
    throw _makeResponseError(
      resp,
      'Retrieving account information failed with an error'
    )
  }
  return await resp.json()
}

export const getNodesSlice: GetNodesSliceFn = async ({
  end_time,
  start_time,
  offset,
  limit,
  origin,
  signal,
}: {
  end_time: Optional<number>
  start_time: Optional<number>
  offset: Optional<number>
  limit: Optional<number>
  origin?: OriginId
  signal?: AbortSignal
}) => {
  const req: NodeAttrsSearchRequest = {
    end_time: end_time || undefined,
    start_time: start_time != null ? start_time : undefined,
    offset: offset || 0,
    limit: limit || undefined,
    origin,
  }
  const rawResp = await fetch(makeUrl(`/nodes-slice`), {
    method: 'POST',
    body: JSON.stringify(req),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (!rawResp.ok) {
    throw _makeResponseError(rawResp)
  }
  const response: NodeAttrsSearchResponse = await rawResp.json()
  const nodes = response.nodes.map((item) => {
    const {
      nid,
      crtd,
      upd,
      text,
      ntype,
      extattrs = undefined,
      index_text = undefined,
      meta = undefined,
    } = item
    const textObj = text as NodeTextData
    return new TNode(
      nid,
      ntype,
      textObj,
      moment.unix(crtd),
      moment.unix(upd),
      meta,
      extattrs,
      index_text,
      { secret_id: null, success: true }
    )
  })
  return {
    ...response,
    nodes,
  }
}

function _getNodesSliceIter({
  end_time,
  start_time,
  limit,
  origin,
  bucket_time_size,
}: {
  end_time?: number
  start_time?: number
  limit?: number
  origin?: OriginId
  bucket_time_size?: number
}) {
  return new TNodeSliceIterator(
    getNodesSlice,
    start_time,
    end_time,
    bucket_time_size,
    limit,
    origin
  )
}

async function createEdge({
  from,
  to,
  signal,
}: {
  from?: string
  to?: string
  signal: AbortSignal
}): Promise<TEdge> {
  verifyIsNotNull(from)
  verifyIsNotNull(to)
  const req = {
    edges: [
      {
        from_nid: from,
        to_nid: to,
      },
    ],
  }
  const resp = await fetch(makeUrl(`/node/${from}/edge`), {
    method: 'POST',
    body: JSON.stringify(req),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (!resp.ok) {
    throw _makeResponseError(resp, 'Empty edge creation response')
  }
  const { edges } = await resp.json()
  if (!edges?.length) {
    throw new Error('Empty edge creation response')
  }
  const edgeOjb = edges[0]
  return new TEdge(edgeOjb)
}

async function getNodeAllEdges(
  nid: string,
  signal?: AbortSignal
): Promise<NodeEdges> {
  const resp = await fetch(makeUrl(`/node/${nid}/edge`), {
    method: 'GET',
    signal,
  })
  if (!resp.ok) {
    throw _makeResponseError(resp, 'Getting node edges failed with error')
  }
  const edges = await resp.json()
  edges.from_edges = edges.from_edges.map((edgeObj: EdgeAttributes) => {
    return new TEdge(edgeObj)
  })
  edges.to_edges = edges.to_edges.map((edgeObj: EdgeAttributes) => {
    return new TEdge(edgeObj)
  })
  return edges as NodeEdges
}

async function switchEdgeStickiness({
  eid,
  signal,
  on,
  off,
}: {
  eid: string
  signal: AbortSignal
  on: Optional<boolean>
  off: Optional<boolean>
}): Promise<Ack> {
  verifyIsNotNull(eid)
  const req = {
    is_sticky: on != null ? on : !off,
  }
  const resp = await fetch(makeUrl(`/edge/${eid}`), {
    method: 'PATCH',
    body: JSON.stringify(req),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (!resp.ok) {
    throw _makeResponseError(
      resp,
      'Switching edge stickiness failed with error'
    )
  }
  return await resp.json()
}

async function deleteEdge({
  eid,
  signal,
}: {
  eid: string
  signal: AbortSignal
}): Promise<Ack> {
  verifyIsNotNull(eid)
  const req = { eid }
  const resp = await fetch(makeUrl(`/node/x/edge`), {
    method: 'DELETE',
    signal,
    body: JSON.stringify(req),
    headers: { 'Content-type': MimeType.JSON },
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

function verifyIsNotNull(value: Optional<any>): void {
  if (value == null) {
    throw new Error('Mandatory parameter is null')
  }
}

async function createSession(
  email: string,
  password: string,
  permissions: number | null,
  signal?: AbortSignal
) {
  verifyIsNotNull(email)
  verifyIsNotNull(password)
  verifyIsNotNull(signal)
  if (!permissions) {
    permissions = 31
  }
  const req = {
    email,
    pass: password,
    permissions,
  }
  const resp = await fetch(makeUrl('/auth/session'), {
    method: 'POST',
    body: JSON.stringify(req),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (!resp.ok) {
    throw _makeResponseError(
      resp,
      `Session creation failed with an error (${resp.status}) ${resp.statusText}`
    )
  }
  return await resp.json()
}

async function deleteSession({ signal }: { signal: AbortSignal }) {
  const resp = await fetch(makeUrl(`/auth/session`), {
    method: 'DELETE',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

async function updateSession(signal?: AbortSignal): Promise<Ack> {
  const resp: Response = await fetch(makeUrl('/auth/session'), {
    method: 'PATCH',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

function _makeExternalUserActivityUrl(origin: OriginId): string {
  return makeUrl(`/activity/external/${origin.id}`)
}

async function addExternalUserActivity(
  origin: OriginId,
  activity: AddUserActivityRequest,
  signal?: AbortSignal
): Promise<TotalUserActivity> {
  const resp = await fetch(_makeExternalUserActivityUrl(origin), {
    method: 'PATCH',
    body: JSON.stringify(activity),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(
    resp,
    `Addition of an external user activity failed for origin ${origin}`
  )
}

async function getExternalUserActivity(
  origin: OriginId,
  signal?: AbortSignal
): Promise<TotalUserActivity> {
  const resp = await fetch(_makeExternalUserActivityUrl(origin), {
    method: 'GET',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(
    resp,
    `Loading of external user activity failed for origin ${origin}`
  )
}

async function recordExternalAssociation(
  origin: {
    from: OriginId
    to: OriginId
  },
  body: AddUserExternalAssociationRequest,
  signal?: AbortSignal
): Promise<Ack> {
  const resp = await fetch(
    makeUrl(`/external/association/${origin.from.id}/${origin.to.id}`),
    {
      body: JSON.stringify(body),
      method: 'POST',
      headers: { 'Content-type': MimeType.JSON },
      signal,
    }
  )
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(
    resp,
    `Addition of transition between origins ${origin.from.id} -> ${origin.to.id} failed`
  )
}

async function getExternalAssociation(
  {
    origin,
  }: {
    origin: OriginId
  },
  signal?: AbortSignal
): Promise<GetUserExternalAssociationsResponse> {
  const resp = await fetch(makeUrl(`/external/association/${origin.id}`), {
    method: 'GET',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(
    resp,
    `Getting of transitions for origin ${origin.id} failed`
  )
}

async function registerAccount({
  name,
  email,
  signal,
}: {
  name: string
  email: string
  signal?: AbortSignal
}): Promise<Ack> {
  const value = { name, email }
  const resp = await fetch(makeUrl('/auth'), {
    method: 'POST',
    body: JSON.stringify(value),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

async function passwordReset({
  token,
  new_password,
  signal,
}: {
  token: string
  new_password: string
  signal: AbortSignal
}): Promise<Ack> {
  const value = { token, new_password }
  const resp = await fetch(makeUrl('/auth/password-recover/reset'), {
    method: 'POST',
    body: JSON.stringify(value),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

async function passwordRecoverRequest({
  email,
  signal,
}: {
  email: string
  signal: AbortSignal
}): Promise<Ack> {
  const value = { emails: [email] }
  const resp = await fetch(makeUrl('/auth/password-recover/request'), {
    method: 'POST',
    body: JSON.stringify(value),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

async function passwordChange(
  old_password: string,
  new_password: string,
  signal?: AbortSignal
) {
  const value = { old_password, new_password }
  const resp = await fetch(makeUrl('/auth/password-recover/change'), {
    method: 'POST',
    body: JSON.stringify(value),
    headers: { 'Content-type': MimeType.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

async function getUserIngestionProgress(
  epid: UserExternalPipelineId,
  signal?: AbortSignal
): Promise<UserExternalPipelineIngestionProgress> {
  const resp = await fetch(
    makeUrl(`/external/ingestion/${epid.pipeline_key}`),
    {
      method: 'GET',
      signal,
    }
  )
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(
    resp,
    `Failed to get ingestion progress for ${JSON.stringify(epid)}`
  )
}
async function advanceUserIngestionProgress(
  epid: UserExternalPipelineId,
  new_progress: AdvanceExternalPipelineIngestionProgress,
  signal?: AbortSignal
): Promise<Ack> {
  const resp = await fetch(
    makeUrl(`/external/ingestion/${epid.pipeline_key}`),
    {
      method: 'PATCH',
      body: JSON.stringify(new_progress),
      headers: { 'Content-type': MimeType.JSON },
      signal,
    }
  )
  if (resp.ok) {
    return await resp.json()
  }
  throw _makeResponseError(
    resp,
    `Failed to advance ingestion progress for ${JSON.stringify(epid)}`
  )
}

export class SmugglerError extends Error {
  status?: number
  statusText?: string

  constructor({
    message,
    status,
    statusText,
  }: {
    message: string
    status?: number
    statusText?: string
  }) {
    super(message)
    this.status = status
    this.statusText = statusText
    Object.setPrototypeOf(this, SmugglerError.prototype)
  }

  static fromAny(value: any): SmugglerError | null {
    if ('message' in value) {
      return new SmugglerError({
        message: value.message,
        status: value.status || undefined,
        statusText: value.statusText || undefined,
      })
    }
    return null
  }
}

function _makeResponseError(response: Response, message?: string): Error {
  if (response.status === StatusCode.LOGIN_TIME_OUT) {
    // Log out immediately, this is a special code from smuggler to inform that
    // current authorisation has been revoked
    log.debug('Authorisation has been revoked by smuggler, log out')
    authCookie.veil.drop()
  }
  return new SmugglerError({
    message: message ?? response.statusText,
    statusText: response.statusText,
    status: response.status,
  })
}

export const smuggler = {
  getAuth,
  node: {
    get: getNode,
    update: updateNode,
    create: createNode,
    createOrUpdate: createOrUpdateNode,
    slice: _getNodesSliceIter,
    lookup: lookupNodes,
    delete: deleteNode,
    bulkDelete: bulkDeleteNodes,
    batch: {
      /**
       * Caution: these methods are not cached
       */
      get: getNodeBatch,
    },
  },
  blob: {
    upload: uploadFiles,
    getSource: makeBlobSourceUrl,
  },
  blob_index: {
    build: buildFilesSearchIndex,
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
      supportsMime: mimeTypeIsSupportedByBuildIndex,
    },
  },
  edge: {
    create: createEdge,
    get: getNodeAllEdges,
    sticky: switchEdgeStickiness,
    delete: deleteEdge,
  },
  session: {
    create: createSession,
    delete: deleteSession,
    update: updateSession,
  },
  activity: {
    external: {
      add: addExternalUserActivity,
      get: getExternalUserActivity,
    },
    association: {
      record: recordExternalAssociation,
      get: getExternalAssociation,
    },
  },
  external: {
    ingestion: {
      get: getUserIngestionProgress,
      advance: advanceUserIngestionProgress,
    },
  },
  user: {
    password: {
      recover: passwordRecoverRequest,
      reset: passwordReset,
      change: passwordChange,
    },
    register: registerAccount,
  },
}
