import {
  EdgeAttributes,
  EdgeStar,
  NewNodeResponse,
  NodeExtattrs,
  NodeTextData,
  TEdge,
  TNode,
  Ack,
  AccountInfo,
} from './types'

import { Mime } from './util/mime'
import { Optional } from './util/optional'

import moment from 'moment'
import lodash from 'lodash'
import { stringify } from 'query-string'

const kHeaderCreatedAt = 'x-created-at'
const kHeaderLastModified = 'last-modified'

export function makeUrl(path?: string, query?: Record<string, any>): string {
  const q = query ? `?${stringify(query)}` : ''
  const p = lodash.trim(path || '', '/')
  const base = lodash.trimEnd(process.env.REACT_APP_SMUGGLER_API_URL || '', '/')
  return `${base}/${p}${q}`
}

async function createNode({
  doc,
  from_nid /* Optional<string> */,
  to_nid /* Optional<string> */,
  signal,
}: {
  doc: NodeTextData
  from_nid?: string
  to_nid?: string
  signal?: AbortSignal
}): Promise<Optional<NewNodeResponse>> {
  signal = signal || undefined
  const query = {
    from: from_nid || undefined,
    to: to_nid || undefined,
  }
  const resp = await fetch(makeUrl('node/new', query), {
    method: 'POST',
    body: JSON.stringify({ text: doc }),
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
) {
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
    NodeTextData.fromJson(text),
    moment(res.headers[kHeaderCreatedAt]),
    moment(res.headers[kHeaderLastModified]),
    meta,
    extattrs ? NodeExtattrs.fromJson(extattrs) : null,
    index_text,
    { secret_id, success }
  )
  return node
}

async function updateNode({
  nid,
  text,
  signal,
}: {
  nid: string
  text: NodeTextData
  signal?: AbortSignal
}) {
  const value = { text: text.toJson() }
  const headers = {
    'Content-type': Mime.JSON,
  }
  return fetch(makeUrl(`/node/${nid}`), {
    method: 'PATCH',
    body: JSON.stringify(value),
    headers,
    signal,
  })
}

async function getAuth({ signal }): Promise<AccountInfo> {
  const resp = await fetch(makeUrl('/auth'), { method: 'GET', signal })
  if (!resp.ok) {
    throw new Error('Retrieving account information failed with an error')
  }
  return await resp.json()
}

export async function ping(): Promise<void> {
  await fetch(makeUrl(), { method: 'GET' })
}

export async function getAnySecondKey() {
  const resp = await fetch(makeUrl('/key/second/*'), {
    method: 'POST',
    headers: { 'Content-type': Mime.JSON },
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function getSecondKey({ id }) {
  const resp = await fetch(makeUrl(`/key/second/${id}`), { method: 'GET' })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function decryptSecretAttrs(account, secretId, attrsEnc) {
  if (account && account.isAuthenticated()) {
    const crypto = account.getLocalCrypto()
    if (crypto && crypto.has(secretId)) {
      // If this is encrypted blob, decrypt it first with local secret
      return await crypto.decryptObj(attrsEnc)
    }
  }
  return {}
}

async function getNodesSlice({ end_time, start_time, offset, signal }) {
  const req = {
    end_time,
    start_time,
    offset: offset || 0,
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
  const response = await rawResp.json()
  const nodes = response.nodes.map((item) => {
    const {
      nid,
      crtd,
      upd,
      text,
      ntype,
      extattrs = null,
      index_text = null,
      meta = null,
    } = item
    const textObj = NodeTextData.fromJson(text)
    const extattrsObj = extattrs ? NodeExtattrs.fromJson(extattrs) : null
    return new TNode(
      nid,
      ntype,
      textObj,
      moment.unix(crtd),
      moment.unix(upd),
      meta,
      extattrsObj,
      index_text,
      { secret_id: null, success: true }
    )
  })
  return {
    ...response,
    nodes,
  }
}

async function createEdge({ from, to, signal }): Promise<TEdge> {
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

async function createFewEdges({ edges, signal }) {
  verifyIsNotNull(edges)
  const req = {
    edges,
  }
  const resp = await fetch(makeUrl(`/node/some/edge`), {
    method: 'POST',
    body: JSON.stringify(req),
    headers: { 'Content-type': Mime.JSON },
    signal,
  })
  if (!resp.ok) {
    throw new Error('Edge creation failed')
  }
  const { edges: newEdges } = await resp.json()
  return newEdges.map((edgeObj) => {
    return new TEdge(edgeObj)
  })
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

async function getEdgesToNode({ nid, signal }): Promise<EdgeStar> {
  return await getNodeEdges(nid, '/to', signal)
}

async function getEdgesFromNode({ nid, signal }): Promise<EdgeStar> {
  return await getNodeEdges(nid, '/from', signal)
}

async function switchEdgeStickiness({ eid, signal, on, off }) {
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

async function deleteEdge({ eid, signal }) {
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

async function getNodeMeta({ nid, signal }) {
  const resp = await fetch(makeUrl(`/node/${nid}/meta`), {
    method: 'GET',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function updateNodeMeta({ nid, meta, signal }) {
  const req = { meta }
  const resp = await fetch(makeUrl(`/node/${nid}/meta`), {
    method: 'PATCH',
    body: JSON.stringify(req),
    headers: { 'Content-type': Mime.JSON },
    signal,
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

async function deleteSession({ signal }) {
  const resp = await fetch(makeUrl(`/auth/session`), {
    method: 'DELETE',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function updateSession({ signal }) {
  const resp = await fetch(makeUrl('/auth/session'), {
    method: 'PATCH',
    signal,
  })
  if (resp.ok) {
    return await resp.json()
  }
  throw new Error(`(${resp.status}) ${resp.statusText}`)
}

async function getUserBadge({ uid, signal }) {
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

async function registerAccount({ name, email, signal }) {
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

async function passwordReset({ token, new_password, signal }) {
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

async function passwordRecoverRequest({ email, signal }) {
  const value = { email }
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

export const smuggler = {
  getAnySecondKey,
  getAuth,
  getSecondKey,
  node: {
    get: getNode,
    update: updateNode,
    create: createNode,
    slice: getNodesSlice,
    delete: deleteNode,
  },
  blob: {
    upload: uploadFiles,
    getSource: makeBlobSourceUrl,
  },
  edge: {
    create: createEdge,
    createFew: createFewEdges,
    getTo: getEdgesToNode,
    getFrom: getEdgesFromNode,
    sticky: switchEdgeStickiness,
    delete: deleteEdge,
  },
  meta: {
    get: getNodeMeta,
    update: updateNodeMeta,
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
  },
  ping,
}
