/**
 * Implementation of smuggler APIs like @see StorageApi which,  to perform their job,
 * interact with an infrastructure hosted in Mazed's datacenter.
 */

import {
  AccountInfo,
  Ack,
  AddUserActivityRequest,
  AddUserExternalAssociationRequest,
  AdvanceExternalPipelineIngestionProgress,
  GenerateBlobIndexResponse,
  GetUserExternalAssociationsResponse,
  NewNodeResponse,
  NodeAttrsSearchRequest,
  NodeAttrsSearchResponse,
  NodeBatch,
  NodeCreateRequestBody,
  NodeCreatedVia,
  NodeEdges,
  NodePatchRequest,
  NodeTextData,
  OriginId,
  TEdge,
  TNode,
  TNodeJson,
  TotalUserActivity,
  UploadMultipartRequestBody as UploadMultipartQuery,
  UploadMultipartResponse,
  UserExternalPipelineId,
  UserExternalPipelineIngestionProgress,
  Nid,
} from './types'
import type {
  NodeBatchRequestBody,
  NodeCreateArgs,
  EdgeCreateArgs,
  StorageApi,
  BlobUploadRequestArgs,
  NodeDeleteArgs,
  NodeBulkDeleteArgs,
  NodeGetArgs,
  NodeGetByOriginArgs,
  NodeUpdateArgs,
  EdgeGetArgs,
  EdgeStickyArgs,
  EdgeDeleteArgs,
  ActivityExternalAddArgs,
  ActivityExternalGetArgs,
  ActivityAssociationRecordArgs,
  ActivityAssociationGetArgs,
  ExternalIngestionGetArgs,
  ExternalIngestionAdvanceArgs,
} from './storage_api'
import { makeUrl } from './api_url'

import { TNodeSliceIterator, GetNodesSliceFn } from './node_slice_iterator'

import { Mime } from 'armoury'
import type { Optional } from 'armoury'
import { MimeType, log } from 'armoury'

import moment from 'moment'
import { StatusCode } from './status_codes'
import { authCookie } from './auth/cookie'
import { makeEmptyNodeTextData, NodeUtil } from './typesutil'
import { AuthenticationApi, SessionCreateArgs } from './authentication_api'
import { NodeEvent } from './api_node_event_listener'

const kHeaderCreatedAt = 'x-created-at'
const kHeaderLastModified = 'last-modified'

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
  }: NodeCreateArgs,
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
    headers['X-Created-At'] = new Date(created_at).toUTCString()
  }
  const resp = await fetch(makeUrl('node/new', query), {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
    signal,
  })
  if (resp.ok) {
    const created = (await resp.json()) as NewNodeResponse
    NodeEvent.registerEvent('created', created.nid, {
      text,
      index_text,
      extattrs,
      ntype,
    })
    return created
  }
  throw _makeResponseError(resp)
}

async function uploadFiles(
  { files, from_nid, to_nid, createdVia }: BlobUploadRequestArgs,
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

function mimeTypeIsSupportedByBuildIndex(mimeType: MimeType): boolean {
  return Mime.isImage(mimeType)
}

function makeBlobSourceUrl(nid: string): string {
  return makeUrl(`/blob/${nid}`)
}

function makeDirectUrl(nid: string): string {
  return makeUrl(`/n/${nid}`)
}

async function deleteNode(
  { nid }: NodeDeleteArgs,
  signal?: AbortSignal
): Promise<Ack> {
  verifyIsNotNull(nid)
  const resp = await fetch(makeUrl(`/node/${nid}`), {
    method: 'DELETE',
    signal,
  })
  if (resp.ok) {
    NodeEvent.registerEvent('deleted', nid, {})
    return await resp.json()
  }
  throw _makeResponseError(resp)
}

async function bulkDeleteNodes(
  { createdVia }: NodeBulkDeleteArgs,
  signal?: AbortSignal
): Promise<number /* number of nodes deleted */> {
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

async function getNode(
  { nid }: NodeGetArgs,
  signal?: AbortSignal
): Promise<TNode> {
  const res = await fetch(makeUrl(`/node/${nid}`), { method: 'GET', signal })
  if (!res.ok) {
    throw _makeResponseError(res)
  }
  const {
    text = makeEmptyNodeTextData(),
    ntype,
    extattrs = null,
    index_text = null,
    meta = null,
  } = await res.json()
  const secret_id = null
  const success = true
  const node: TNode = {
    nid,
    ntype,
    text: text as NodeTextData,
    created_at: moment(res.headers.get(kHeaderCreatedAt)),
    updated_at: moment(res.headers.get(kHeaderLastModified)),
    meta,
    extattrs,
    index_text,
    crypto: { secret_id, success },
  }
  return node
}

async function getNodesByOrigin(
  { origin }: NodeGetByOriginArgs,
  _signal?: AbortSignal
): Promise<TNode[]> {
  const sliceAll: GetNodeSliceArgs = {
    start_time: 0, // since the beginning of time
    bucket_time_size: 366 * 24 * 60 * 60,
    origin,
  }
  const ret: TNode[] = []
  const iter = _getNodesSliceIter(sliceAll)
  for (let node = await iter.next(); node != null; node = await iter.next()) {
    ret.push(node)
  }
  return ret
}

async function getNodeBatch(
  req: NodeBatchRequestBody,
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
    nodes: nodes.map((jsonNode: TNodeJson) => NodeUtil.fromJson(jsonNode)),
  }
}

async function updateNode(
  args: NodeUpdateArgs,
  signal?: AbortSignal
): Promise<Ack> {
  const { nid, text, index_text, preserve_update_time } = args
  const headers = {
    'Content-type': MimeType.JSON,
  }
  const request: NodePatchRequest = {
    text,
    index_text,
    preserve_update_time,
  }
  const resp = await fetch(makeUrl(`/node/${nid}`), {
    method: 'PATCH',
    body: JSON.stringify(request),
    headers,
    signal,
  })
  if (resp.ok) {
    NodeEvent.registerEvent('updated', nid, { text, index_text })
    return await resp.json()
  }
  throw _makeResponseError(resp)
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

const getNodesSlice: GetNodesSliceFn = async ({
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
      text = makeEmptyNodeTextData(),
      ntype,
      extattrs = undefined,
      index_text = undefined,
      meta = undefined,
    } = item
    return {
      nid,
      ntype,
      text,
      created_at: moment.unix(crtd),
      updated_at: moment.unix(upd),
      meta,
      extattrs,
      index_text,
      crypto: { secret_id: null, success: true },
    }
  })
  return {
    ...response,
    nodes,
  }
}

type GetNodeSliceArgs = {
  start_time?: number
  origin?: OriginId
  bucket_time_size?: number
}

function _getNodesSliceIter({
  start_time,
  origin,
  bucket_time_size,
}: GetNodeSliceArgs) {
  return new TNodeSliceIterator(
    getNodesSlice,
    start_time,
    undefined,
    bucket_time_size,
    undefined,
    origin
  )
}

async function createEdge(
  { from, to }: EdgeCreateArgs,
  signal?: AbortSignal
): Promise<TEdge> {
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
  return edges[0] as TEdge
}

async function getNodeAllEdges(
  { nid }: EdgeGetArgs,
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
  return edges as NodeEdges
}

async function switchEdgeStickiness(
  { eid, on, off }: EdgeStickyArgs,
  signal?: AbortSignal
): Promise<Ack> {
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

async function deleteEdge(
  { eid }: EdgeDeleteArgs,
  signal?: AbortSignal
): Promise<Ack> {
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
  { email, password, permissions }: SessionCreateArgs,
  signal?: AbortSignal
): Promise<{}> {
  verifyIsNotNull(email)
  verifyIsNotNull(password)
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
  { origin, activity }: ActivityExternalAddArgs,
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
  { origin }: ActivityExternalGetArgs,
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
  { origin, body }: ActivityAssociationRecordArgs,
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
  { origin }: ActivityAssociationGetArgs,
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
): Promise<Ack> {
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
  { epid }: ExternalIngestionGetArgs,
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
  { epid, new_progress }: ExternalIngestionAdvanceArgs,
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
    this.name = 'SmugglerError'
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

export function isSmugglerError(value: any): value is SmugglerError {
  return value instanceof Error && value.name === 'SmugglerError'
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

export function makeDatacenterStorageApi(): StorageApi {
  const throwUnimplementedError = (endpoint: string) => {
    return (..._: any[]): never => {
      throw new Error(
        `Attempted to call an ${endpoint} endpoint of datacenter StorageApi` +
          " which hasn't been implemented yet"
      )
    }
  }
  return {
    node: {
      get: getNode,
      getByOrigin: getNodesByOrigin,
      getAllNids: throwUnimplementedError('node.getAllNids'),
      update: updateNode,
      create: createNode,
      iterate: async () => _getNodesSliceIter({}),
      delete: deleteNode,
      bulkDelete: bulkDeleteNodes,
      batch: {
        /**
         * Caution: these methods are not cached
         */
        get: getNodeBatch,
      },
      url: makeDirectUrl,
      addListener: NodeEvent.addListener,
      removeListener: NodeEvent.removeListener,
      getNodeSimilaritySearchInfo: throwUnimplementedError(
        'node.getNodeSimilaritySearchInfo'
      ),
      setNodeSimilaritySearchInfo: throwUnimplementedError(
        'node.setNodeSimilaritySearchInfo'
      ),
    },
    blob: {
      upload: uploadFiles,
      sourceUrl: makeBlobSourceUrl,
    },
    blob_index: {
      build: buildFilesSearchIndex,
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
  }
}

export const authentication: AuthenticationApi = {
  getAuth,
  session: {
    create: createSession,
    delete: deleteSession,
    update: updateSession,
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
