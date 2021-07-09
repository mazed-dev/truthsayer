import axios from 'axios'
import moment from 'moment'

import { stringify } from 'query-string'

import { dealWithError } from './error.jsx'

import { extractDocAttrs } from './../search/attrs.jsx'
import { createEmptyDoc, exctractDoc } from './../doc/doc'
import { LocalCrypto } from './../crypto/local.jsx'
import { base64 } from './../util/base64.jsx'

const kHeaderAttrs = 'x-node-attrs'
const kHeaderCreatedAt = 'x-created-at'
const kHeaderLastModified = 'last-modified'
const kHeaderContentType = 'content-type'
const kHeaderLocalSecretId = 'x-local-secret-id'
const kHeaderLocalSignature = 'x-local-signature'
const kHeaderNodeMeta = 'x-node-meta'

const kHeaderContentTypeUtf8 = 'text/plain; charset=utf-8'

async function _tryToEncryptDocLocally(doc, account) {
  let value
  const headers = { [kHeaderContentType]: kHeaderContentTypeUtf8 }
  const crypto = LocalCrypto.getInstance()
  if (crypto && crypto.has()) {
    const encryptedDoc = await crypto.encryptObj(doc)
    value = encryptedDoc.encrypted
    headers[kHeaderLocalSecretId] = encryptedDoc.secret_id
    headers[kHeaderLocalSignature] = encryptedDoc.signature
  } else {
    value = JSON.stringify(doc)
  }
  return {
    value,
    headers,
  }
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
  return { doc: exctractDoc(data, nid), secret_id: null, success: true }
}

async function createNode({
  doc,
  text,
  cancelToken,
  from_nid,
  to_nid,
  account,
}) {
  const query = {}
  if (from_nid) {
    query.from = from_nid
  } else if (to_nid) {
    query.to = to_nid
  }

  doc = doc || (text && exctractDoc(text, '.new')) || createEmptyDoc()
  const { value, headers } = await _tryToEncryptDocLocally(doc, account)

  const config = {
    headers,
    cancelToken,
  }

  return axios
    .post(`/api/node/new?${stringify(query)}`, value, config)
    .then((resp) => {
      return resp.data ? resp.data : null
    })
    .catch(dealWithError)
}

async function deleteNode({ nid, cancelToken }) {
  verifyIsNotNull(nid)
  const config = {
    cancelToken,
  }
  return axios
    .delete(`/api/node/${nid}`, {
      cancelToken,
    })
    .catch(dealWithError)
}

export class TNode {
  constructor({
    nid,
    doc,
    created_at,
    updated_at,
    attrs,
    meta,
    secret_id,
    success,
  }) {
    this.nid = nid
    this.doc = doc
    this.created_at = created_at
    this.updated_at = updated_at
    this.attrs = attrs
    this.meta = meta
    this.crypto = {
      secret_id,
      success,
    }
  }

  isOwnedBy(account) {
    return (
      account && account.isAuthenticated() && account.getUid() === this.meta.uid
    )
  }

  getOwner() {
    return this.meta.uid
  }
}

async function getNode({ nid, account, cancelToken }) {
  const res = await axios
    .get(`/api/node/${nid}`, {
      cancelToken,
    })
    .catch(dealWithError)
  if (!res) {
    return null
  }
  const metaStr = res.headers[kHeaderNodeMeta]
  const meta = metaStr != null ? base64.toObject(metaStr) : {}
  const signature = meta.local_signature // res.headers[kHeaderLocalSignature];
  const secretId = meta.local_secret_id // res.headers[kHeaderLocalSecretId];
  const { doc, secret_id, success } = await _tryToDecryptDocLocally(
    nid,
    res.data,
    signature,
    secretId,
    account
  )
  return new TNode({
    nid,
    doc,
    created_at: moment(res.headers[kHeaderCreatedAt]),
    updated_at: moment(res.headers[kHeaderLastModified]),
    attrs: null,
    meta,
    secret_id,
    success,
  })
}

async function updateNode({ nid, doc, cancelToken, account }) {
  const { value, headers } = await _tryToEncryptDocLocally(doc, account)
  const config = {
    headers,
    cancelToken,
  }
  return axios.patch(`/api/node/${nid}`, value, config).catch(dealWithError)
}

export function getAuth({ cancelToken }) {
  return axios.get('/api/auth', { cancelToken }).catch(dealWithError)
}

export function getAnySecondKey() {
  return axios
    .post('/api/key/second/*')
    .then((res) => {
      return res.data
    })
    .catch(dealWithError)
}

export function getSecondKey({ id }) {
  return axios
    .get(`/api/key/second/${id}`)
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

async function nodeAttrsSearch({
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
  const rawResp = await axios
    .post('/api/node-attrs-search', req, {
      cancelToken,
    })
    .catch(dealWithError)
  if (!rawResp) {
    return null
  }
  const response = rawResp.data
  response.nodes = await Promise.all(
    response.nodes.map(async (item) => {
      const attrs = item.attrs
      if (typeof attrs === 'string') {
        const attrsEnc = base64.toObject(attrs)
        const secretId = attrsEnc.secret_id
        if (secretId) {
          item.attrs = await decryptSecretAttrs(account, secretId, attrsEnc)
        } else {
          item.attrs = attrsEnc
        }
      }
      const meta = item.meta
      const { doc, secret_id, success } = await _tryToDecryptDocLocally(
        item.nid,
        item.data,
        meta.local_signature,
        meta.local_secret_id,
        account
      )
      return new TNode({
        nid: item.nid,
        doc,
        created_at: moment.unix(item.crtd),
        updated_at: moment.unix(item.upd),
        attrs: item.attrs,
        meta,
        secret_id,
        success,
      })
    })
  )
  return response
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
  return axios
    .post(`/api/node/${from}/edge`, req, {
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
  return axios
    .post('/api/node/some/edge', req, {
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
  return axios
    .get(`/api/node/${nid}${dir}`, {
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
  return axios
    .patch(`/api/edge/${eid}`, req, {
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
  return axios
    .delete('/api/node/x/edge', {
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
  return await axios
    .get(`/api/node/${nid}/meta`, {
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
  return await axios
    .patch(`/api/node/${nid}/meta`, req, {
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
  return axios
    .post('/api/auth/session', req, {
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
  return axios
    .delete('/api/auth/session', {
      cancelToken,
    })
    .then((res) => {
      if (res && res.data) {
        return res.data
      }
      return null
    })
}

async function getUserBadge({ uid, cancelToken }) {
  verifyIsNotNull(uid)
  verifyIsNotNull(cancelToken)
  return axios
    .get(`/api/user/${uid}/badge`, {
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

export const smugler = {
  getAnySecondKey,
  getAuth,
  getSecondKey,
  node: {
    get: getNode,
    update: updateNode,
    create: createNode,
    slice: nodeAttrsSearch,
    delete: deleteNode,
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
  },
  user: {
    badge: {
      get: getUserBadge,
    },
  },
}
