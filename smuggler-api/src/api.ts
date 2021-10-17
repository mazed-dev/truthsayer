import { NodeExtattrs, TNode, NodeTextData } from './types'

import { Mime } from './util/mime'
import { Optional } from './util/optional'

import axios, { CancelToken, AxiosError } from 'axios'
import moment from 'moment'
import { stringify } from 'query-string'

const kHeaderCreatedAt = 'x-created-at'
const kHeaderLastModified = 'last-modified'
const kHeaderContentType = 'content-type'

export type { CancelToken }

function dealWithError(error: AxiosError) {}

function _getSmuglerApibaseURL() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '/smuggler'
    case 'development':
      return undefined
    case 'test':
      return undefined
    default:
      return undefined
  }
}

const _client = axios.create({
  baseURL: _getSmuglerApibaseURL(),
  timeout: 8000,
})

export type NewNodeResponse = {
  nid: string
  from: Optional<string>
  to: Optional<string>
}

async function createNode({
  doc,
  from_nid /* Optional<string> */,
  to_nid /* Optional<string> */,
  cancelToken,
}: {
  doc: NodeTextData
  from_nid?: string
  to_nid?: string
  cancelToken: import('axios').CancelToken
}): Promise<Optional<NewNodeResponse>> {
  const query: {
    from?: string
    to?: string
  } = {}
  if (from_nid) {
    query.from = from_nid
  } else if (to_nid) {
    query.to = to_nid
  }
  const headers = { [kHeaderContentType]: Mime.JSON }
  const value = { text: doc }
  const resp = await _client.post(`/node/new?${stringify(query)}`, value, {
    headers,
    cancelToken,
  })
  return resp.data ? resp.data : null
}

async function uploadFiles({
  files,
  from_nid,
  to_nid,
  cancelToken,
}: {
  files: File[]
  from_nid?: string
  to_nid?: string
  cancelToken: CancelToken
}) {
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
  const headers = { [kHeaderContentType]: Mime.FORM_DATA }
  const config = {
    headers,
    cancelToken,
    timeout: 60000, // Extend timeout, files could be quite large and smuggler is a bit slow too
  }
  const resp = await _client.post(
    `/blob/new?${stringify(query)}`,
    value,
    config
  )
  return resp.data ? resp.data : null
}

function makeBlobSourceUrl(nid: string): string {
  const base = _getSmuglerApibaseURL() || ''
  return `${base}/blob/${nid}`
}

async function deleteNode({
  nid,
  cancelToken,
}: {
  nid: string
  cancelToken: CancelToken
}): Promise<void> {
  verifyIsNotNull(nid)
  return _client
    .delete(`/node/${nid}`, {
      cancelToken,
    })
    .then((_res) => {})
    .catch(dealWithError)
}

async function getNode({
  nid,
  cancelToken,
}: {
  nid: string
  cancelToken: CancelToken
}): Promise<Optional<TNode>> {
  const res = await _client
    .get(`/node/${nid}`, {
      cancelToken,
    })
    .catch(dealWithError)
  if (!res || !res.data) {
    return null
  }
  const {
    text,
    ntype,
    extattrs = null,
    index_text = null,
    meta = null,
  } = res.data
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
  cancelToken,
}: {
  nid: string
  text: NodeTextData
  cancelToken: CancelToken
}) {
  const value = { text: text.toJson() }
  const headers = {
    [kHeaderContentType]: Mime.JSON,
  }
  const config = { headers, cancelToken }
  return _client.patch(`/node/${nid}`, value, config).catch(dealWithError)
}

export function getAuth({ cancelToken }) {
  return _client.get(`/auth`, { cancelToken }).catch(dealWithError)
}

export function getAnySecondKey() {
  return _client
    .post(`/key/second/*`)
    .then((res) => {
      return res.data
    })
    .catch(dealWithError)
}

export function getSecondKey({ id }) {
  return _client
    .get(`/key/second/${id}`)
    .then((res) => {
      return res.data
    })
    .catch(dealWithError)
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

async function getNodesSlice({
  end_time,
  start_time,
  offset,
  cancelToken,
  account,
}) {
  const req = {
    end_time,
    start_time,
    offset: offset || 0,
  }
  const rawResp = await _client
    .post(`/nodes-slice`, req, {
      cancelToken,
    })
    .catch(dealWithError)
  if (!rawResp) {
    return null
  }
  const response = rawResp.data
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

async function createEdge({ from, to, cancelToken }) {
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
  return _client
    .post(`/node/${from}/edge`, req, {
      cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res && res.data && res.data.edges && res.data.edges.length > 0) {
        return new TEdge(res.data.edges[0])
      }
      return null
    })
}

async function createFewEdges({ edges, cancelToken }) {
  verifyIsNotNull(edges)
  const req = {
    edges,
  }
  return _client
    .post(`/node/some/edge`, req, {
      cancelToken: cancelToken.token,
    })
    .then((res) => {
      if (res) {
        return res.data.edges.map((edgeObj) => {
          return new TEdge(edgeObj)
        })
      }
    })
}

interface Edge {
  eid: string
  txt: string
  from_nid: string
  to_nid: string
  crtd: moment.Moment
  upd: moment.Moment
  weight: number
  is_sticky: boolean
  owned_by: string
}

class TEdge implements Edge {
  eid: string
  txt: string
  from_nid: string
  to_nid: string
  crtd: moment.Moment
  upd: moment.Moment
  weight: number
  is_sticky: boolean
  owned_by: string

  constructor(edge: Edge) {
    this.eid = edge.eid
    this.txt = edge.txt
    this.from_nid = edge.from_nid
    this.to_nid = edge.to_nid
    this.crtd = edge.crtd
    this.upd = edge.upd
    this.weight = edge.weight
    this.is_sticky = edge.is_sticky
    this.owned_by = edge.owned_by
  }
  // isOwnedBy(account) {
  //   return (
  //     account && account.isAuthenticated() && account.getUid() === this.owned_by
  //   );
  // }
}

async function getNodeEdges(nid, cancelToken, dir) {
  verifyIsNotNull(nid)
  verifyIsNotNull(dir)
  return _client
    .get(`/node/${nid}${dir}`, {
      cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res) {
        const star = res.data
        star.edges = star.edges.map((edgeObj) => {
          return new TEdge(edgeObj)
        })
        return star
      }
      return null
    })
}

async function getEdgesToNode({ nid, cancelToken }) {
  return await getNodeEdges(nid, cancelToken, '/to')
}

async function getEdgesFromNode({ nid, cancelToken }) {
  return await getNodeEdges(nid, cancelToken, '/from')
}

async function switchEdgeStickiness({ eid, cancelToken, on, off }) {
  verifyIsNotNull(eid)
  const req = {
    is_sticky: on != null ? on : !off,
  }
  return _client
    .patch(`/edge/${eid}`, req, {
      cancelToken,
    })
    .then((res) => {
      if (res) {
        return res.data
      }
      return null
    })
}

async function deleteEdge({ eid, cancelToken }) {
  verifyIsNotNull(eid)
  const req = {
    eid,
  }
  return _client
    .delete(`/node/x/edge`, {
      cancelToken,
      data: req,
    })
    .then((res) => {
      if (res) {
        return res.data
      }
      return null
    })
}

async function getNodeMeta({ nid, cancelToken }) {
  return await _client
    .get(`/node/${nid}/meta`, {
      cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res && res.data) {
        return res.data
      }
    })
}

async function updateNodeMeta({ nid, meta, cancelToken }) {
  const req = {
    meta,
  }
  return await _client
    .patch(`/node/${nid}/meta`, req, {
      cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res && res.data) {
        return res.data
      }
    })
}

function verifyIsNotNull(value) {
  if (value == null) {
    const err = new Error('Mandatory parameter is null')
    throw err
  }
}

async function createSession({ email, password, permissions, cancelToken }) {
  verifyIsNotNull(email)
  verifyIsNotNull(password)
  verifyIsNotNull(cancelToken)
  if (!permissions) {
    permissions = 31
  }
  const req = {
    email,
    pass: password,
    permissions,
  }
  return _client
    .post(`/auth/session`, req, {
      cancelToken,
    })
    .then((res) => {
      if (res && res.data) {
        return res.data
      }
      return null
    })
}

async function deleteSession({ cancelToken }) {
  return _client
    .delete(`/auth/session`, {
      cancelToken,
    })
    .then((res) => {
      if (res && res.data) {
        return res.data
      }
      return null
    })
}

async function updateSession({ cancelToken }) {
  return _client.patch(`/auth/session`, {
    cancelToken,
  })
}

async function getUserBadge({ uid, cancelToken }) {
  verifyIsNotNull(uid)
  verifyIsNotNull(cancelToken)
  return await _client
    .get(`/user/${uid}/badge`, {
      cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res && res.data) {
        return res.data
      }
      return null
    })
}

async function registerAccount({ name, email, cancelToken }) {
  const value = { name, email }
  return await _client.post('/auth', value, { cancelToken })
}

async function passwordReset({ token, new_password, cancelToken }) {
  const value = { token, new_password }
  return await _client
    .post('/auth/password-recover/reset', value, { cancelToken })
    .catch((err) => {
      alert(`Error ${err}`)
    })
}

async function passwordRecoverRequest({ email, cancelToken }) {
  const value = { email }
  return await _client.post('/auth/password-recover/request', value, {
    cancelToken,
  })
}

async function passwordChange(old_password, new_password, cancelToken) {
  const value = { old_password, new_password }
  return await axios.post('/auth/password-recover/change', value, {
    cancelToken,
  })
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
  makeCancelToken: () => {
    return axios.CancelToken.source()
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
}
