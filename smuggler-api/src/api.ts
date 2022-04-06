import {
  AccountInfo,
  Ack,
  AdvanceUserFsIngestionProgress,
  EdgeAttributes,
  EdgeStar,
  GenerateBlobIndexResponse,
  NewNodeResponse,
  NodeAttrsSearchRequest,
  NodeAttrsSearchResponse,
  NodeCreateRequestBody,
  NodeExtattrs,
  NodeIndexText,
  NodeOrigin,
  NodePatchRequest,
  NodeTextData,
  NodeType,
  TEdge,
  TNode,
  UploadMultipartResponse,
  UserBadge,
  UserFilesystemId,
  UserFsIngestionProgress,
} from './types'

import { makeUrl } from './api_url'

import { TNodeSliceIterator, GetNodesSliceFn } from './node_slice_iterator'

import { Mime } from 'armoury'
import type { Optional } from 'armoury'

import moment from 'moment'

const kHeaderCreatedAt = 'x-created-at'
const kHeaderLastModified = 'last-modified'

async function createNode({
  text,
  from_nid,
  to_nid,
  index_text,
  extattrs,
  ntype,
  origin,
  signal,
}: {
  text: NodeTextData
  from_nid?: string
  to_nid?: string
  index_text?: NodeIndexText
  extattrs?: NodeExtattrs
  ntype?: NodeType
  origin?: NodeOrigin
  signal?: AbortSignal
}): Promise<NewNodeResponse> {
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
  }
  const resp = await fetch(makeUrl('node/new', query), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function uploadFiles(
  files: File[],
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  signal?: AbortSignal
): Promise<UploadMultipartResponse> {
  const query: {
    from?: string
    to?: string
  } = {}
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
    throw new Error(`(${resp.status}) ${resp.statusText}`)
  }
  return await resp.json()
}

async function buildFilesSearchIndex(
  files: File[],
  signal?: AbortSignal
): Promise<GenerateBlobIndexResponse> {
  const value = new FormData()
  files.forEach((file) => value.append('file', file, file.name))
  const resp = await fetch(makeUrl('/blob-index'), {
    method: 'POST',
    body: value,
    signal,
  })
  if (!resp.ok) {
    throw new Error(`(${resp.status}) ${resp.statusText}`)
  }
  return await resp.json()
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
  throw new Error(`(${resp.status}) ${resp.statusText}`)
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
    throw new Error(`(${res.status}) ${res.statusText}`)
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

async function updateNode({
  nid,
  signal,
  text,
  index_text,
  preserve_update_time,
}: {
  nid: string
  text?: NodeTextData
  index_text?: NodeIndexText
  preserve_update_time?: boolean
  signal?: AbortSignal
}) {
  const headers = {
    'Content-type': Mime.JSON,
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
  signal: AbortSignal
}): Promise<AccountInfo> {
  const resp = await fetch(makeUrl('/auth'), { method: 'GET', signal })
  if (!resp.ok) {
    throw new Error('Retrieving account information failed with an error')
  }
  return await resp.json()
}

export async function ping(): Promise<void> {
  await fetch(makeUrl(), { method: 'GET' })
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
  origin?: NodeOrigin
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (!rawResp.ok) {
    throw new Error(`(${rawResp.status}) ${rawResp.statusText}`)
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
  origin?: NodeOrigin
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (!resp.ok) {
    throw new Error('Empty edge creation response')
  }
  const { edges } = await resp.json()
  if (!edges?.length) {
    throw new Error('Empty edge creation response')
  }
  const edgeOjb = edges[0]
  return new TEdge(edgeOjb)
}

async function getNodeEdges(
  nid: string,
  dir: '/to' | '/from',
  signal?: AbortSignal
): Promise<EdgeStar> {
  verifyIsNotNull(nid)
  verifyIsNotNull(dir)
  const resp = await fetch(makeUrl(`/node/${nid}${dir}`), {
    method: 'GET',
    signal,
  })
  if (!resp.ok) {
    throw new Error('Getting node edges failed with error')
  }
  const star = await resp.json()
  star.edges = star.edges.map((edgeObj: EdgeAttributes) => {
    return new TEdge(edgeObj)
  })
  return star
}

async function getEdgesToNode({
  nid,
  signal,
}: {
  nid: string
  signal: AbortSignal
}): Promise<EdgeStar> {
  return await getNodeEdges(nid, '/to', signal)
}

async function getEdgesFromNode({
  nid,
  signal,
}: {
  nid: string
  signal: AbortSignal
}): Promise<EdgeStar> {
  return await getNodeEdges(nid, '/from', signal)
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (!resp.ok) {
    throw new Error('Switching edge stickiness failed with error')
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
    headers: { 'Content-type': Mime.JSON },
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (!resp.ok) {
    throw new Error(
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
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function updateSession(signal?: AbortSignal): Promise<Ack> {
  const resp = await fetch(makeUrl('/auth/session'), {
    method: 'PATCH',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function getUserBadge({
  uid,
  signal,
}: {
  uid: string
  signal: AbortSignal
}): Promise<UserBadge> {
  verifyIsNotNull(uid)
  verifyIsNotNull(signal)
  const resp = await fetch(makeUrl(`/user/${uid}/badge`), {
    method: 'GET',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
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
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function getUserFsIngestionProgress(
  fsid: UserFilesystemId,
  signal?: AbortSignal
): Promise<UserFsIngestionProgress> {
  const resp = await fetch(
    makeUrl(`/user/${fsid.uid}/3rdparty/fs/${fsid.fs_key}/progress`),
    {
      method: 'GET',
      signal,
    }
  )
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}
async function advanceUserFsIngestionProgress(
  fsid: UserFilesystemId,
  new_progress: AdvanceUserFsIngestionProgress,
  signal?: AbortSignal
) {
  const resp = await fetch(
    makeUrl(`/user/${fsid.uid}/3rdparty/fs/${fsid.fs_key}/progress`),
    {
      method: 'PATCH',
      body: JSON.stringify(new_progress),
      headers: { 'Content-type': Mime.JSON },
      signal,
    }
  )
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

export const smuggler = {
  getAuth,
  node: {
    get: getNode,
    update: updateNode,
    create: createNode,
    slice: _getNodesSliceIter,
    delete: deleteNode,
  },
  blob: {
    upload: uploadFiles,
    getSource: makeBlobSourceUrl,
  },
  blob_index: {
    build: buildFilesSearchIndex,
  },
  edge: {
    create: createEdge,
    getTo: getEdgesToNode,
    getFrom: getEdgesFromNode,
    sticky: switchEdgeStickiness,
    delete: deleteEdge,
  },
  snitch: {
    // Todo(akindyakov): monitoring counters and logs
    report: null,
    record: null,
  },
  session: {
    create: createSession,
    delete: deleteSession,
    update: updateSession,
  },
  user: {
    badge: {
      get: getUserBadge,
    },
    password: {
      recover: passwordRecoverRequest,
      reset: passwordReset,
      change: passwordChange,
    },
    register: registerAccount,
    thirdparty: {
      fs: {
        progress: {
          get: getUserFsIngestionProgress,
          advance: advanceUserFsIngestionProgress,
        },
      },
    },
  },
  ping,
}
