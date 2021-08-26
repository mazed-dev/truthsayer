import { NodeData, NodeMeta, TNode, TNodeAttrs, TNodeCrypto } from './types'

import axios from 'axios'
import moment from 'moment'

import { stringify } from 'query-string'

import { dealWithError } from './error.jsx'

import { extractDocAttrs } from './../search/attrs.jsx'
import { makeDoc, exctractDoc } from './../doc/doc_util'
import { LocalCrypto } from './../crypto/local.jsx'
import { base64 } from './../util/base64.jsx'
import { debug } from './../util/log'
import { Mime } from './../util/Mime'

const lodash = require('lodash')

const kHeaderAttrs = 'x-node-attrs'
const kHeaderCreatedAt = 'x-created-at'
const kHeaderLastModified = 'last-modified'
const kHeaderContentType = 'content-type'
const kHeaderLocalSecretId = 'x-local-secret-id'
const kHeaderLocalSignature = 'x-local-signature'
const kHeaderNodeMeta = 'x-node-meta'

export type CancelToken = axios.CancelToken

function _getSmuglerApibaseURL() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '/smuggler'
    case 'development':
      return null
    case 'test':
      return null
    default:
      return null
  }
}

const _client = axios.create({
  baseURL: _getSmuglerApibaseURL(),
  timeout: 1000,
})

async function _tryToEncryptDocLocally(doc, account) {
  const crypto = LocalCrypto.getInstance()
  if (crypto && crypto.has()) {
    const encryptedDoc = await crypto.encryptObj(doc)
    const value = encryptedDoc.encrypted
    const headers = {
      [kHeaderLocalSecretId]: encryptedDoc.secret_id,
      [kHeaderLocalSignature]: encryptedDoc.signature,
      [kHeaderContentType]: Mime.TEXT_PLAIN,
    }
    return { value, headers }
  }
  return null
}

async function _tryToDecryptDocLocally(
  nid,
  data,
  signature,
  secretId,
  account
) {
  if (secretId && signature) {
    // const secretId = headers[kHeaderLocalSecretId];
    if (!(account && account.isAuthenticated())) {
      return { doc: null, secret_id: secretId, success: false }
    }
    const crypto = account.getLocalCrypto()
    if (!crypto || !crypto.has(secretId)) {
      return { doc: null, secret_id: secretId, success: false }
    } else {
      // const encryptedAttrs = headers[kHeaderAttrs];
      // const signature = headers[kHeaderLocalSignature];
      const encryptedDoc = {
        encrypted: data,
        secret_id: secretId,
        signature,
      }
      const doc = await crypto.decryptObj(encryptedDoc)
      return { doc, secret_id: secretId, success: true }
    }
  }
  try {
    data = JSON.parse(data)
  } catch (error) {
    // debug('Invalid JSON')
  }
  return { doc: await exctractDoc(data), secret_id: null, success: true }
}

async function createNode({
  doc,
  file,
  from_nid /* Optional<string> */,
  to_nid /* Optional<string> */,
  account,
  cancelToken,
}) {
  const query = {}
  if (from_nid) {
    query.from = from_nid
  } else if (to_nid) {
    query.to = to_nid
  }

  let headers = {}
  let value
  if (doc == null && file != null) {
    value = new FormData()
    value.append('file', file, file.name)
    headers[
      kHeaderContentType
    ] = `multipart/form-data; boundary=${value._boundary}`
    const config = { headers, cancelToken }
    const resp = await _client.post(
      `/node-upload?${stringify(query)}`,
      value,
      config
    )
    return resp.data ? resp.data : null
  } else {
    doc = doc || (await makeDoc())
    const encrypted = await _tryToEncryptDocLocally(doc, account)
    if (encrypted) {
      value = encrypted.value
      headers = { ...headers, ...encrypted.headers }
    } else {
      value = JSON.stringify(doc)
      headers[kHeaderContentType] = Mime.JSON
    }
  }
  const config = { headers, cancelToken }
  const resp = await _client.post(
    `/node/new?${stringify(query)}`,
    value,
    config
  )
  return resp.data ? resp.data : null
}

async function uploadFiles({ files, from_nid, to_nid, account, cancelToken }) {
  const query = {}
  if (from_nid) {
    query.from = from_nid
  } else if (to_nid) {
    query.to = to_nid
  }
  const value = new FormData()
  files.forEach((file) => value.append('file', file, file.name))
  const headers = {
    [kHeaderContentType]: `multipart/form-data; boundary=${value._boundary}`,
  }
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
  makeBlobSourceUrl.base = _getSmuglerApibaseURL() || ''
  return `${makeBlobSourceUrl.base}/blob/${nid}`
}

async function deleteNode({ nid, cancelToken }) {
  verifyIsNotNull(nid)
  const config = {
    cancelToken,
  }
  return _client
    .delete(`/node/${nid}`, {
      cancelToken,
    })
    .catch(dealWithError)
}

async function getNode({ nid, account, cancelToken }) {
  const res = await _client
    .get(`/node/${nid}`, {
      cancelToken,
    })
    .catch(dealWithError)
  if (!res) {
    return null
  }
  const metaStr = res.headers[kHeaderNodeMeta]
  const meta = metaStr != null ? base64.toObject(metaStr) : {}
  const secret_id = meta.local_secret_id
  const success = true
  // const signature = meta.local_signature
  // const { doc, secret_id, success } = await _tryToDecryptDocLocally(
  const data = await NodeData.fromJson(res.data)
  const node = new TNode(
    nid,
    data,
    moment(res.headers[kHeaderCreatedAt]),
    moment(res.headers[kHeaderLastModified]),
    null,
    meta,
    { secret_id, success }
  )
  return node
}

async function updateNode({ node, cancelToken, account }) {
  let value
  let headers
  const { nid } = node
  const data = node.data.toJson()
  const encrypted = await _tryToEncryptDocLocally(data, account)
  if (encrypted) {
    value = encrypted.value
    headers = encrypted.headers
  } else {
    value = JSON.stringify(data)
    headers = {
      [kHeaderContentType]: Mime.JSON,
    }
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
  const nodes = await Promise.all(
    response.nodes.map(async (item) => {
      const { nid, meta, crtd, upd } = item
      let { attrs, data } = item
      if (typeof attrs === 'string') {
        const attrsEnc = base64.toObject(attrs)
        const secretId = attrsEnc.secret_id
        if (secretId) {
          attrs = await decryptSecretAttrs(account, secretId, attrsEnc)
        } else {
          attrs = attrsEnc
        }
      }
      // const { doc, secret_id, success } = await _tryToDecryptDocLocally(
      const secret_id = null
      const success = true
      if (lodash.isString(data)) {
        data = JSON.parse(data)
      }
      data = await NodeData.fromJson(data)
      const node = new TNode(
        nid,
        data,
        moment.unix(crtd),
        moment.unix(upd),
        attrs,
        meta,
        { secret_id, success }
      )
      return node
    })
  )
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

class TEdge {
  constructor({
    eid, // EdgeId,
    txt, // String,
    from_nid, // NodeId,
    to_nid, // NodeId,
    crtd, // i64,
    upd, // i64,
    weight, // i32,
    is_sticky, // bool,
    owned_by, // UserUid,
  }) {
    this.eid = eid
    this.txt = txt
    this.from_nid = from_nid
    this.to_nid = to_nid
    this.crtd = crtd
    this.upd = upd
    this.weight = weight
    this.is_sticky = is_sticky
    this.owned_by = owned_by
  }

  isOwnedBy(account) {
    return (
      account && account.isAuthenticated() && account.getUid() === this.owned_by
    )
  }
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

export const smugler = {
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
