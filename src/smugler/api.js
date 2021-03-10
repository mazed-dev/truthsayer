import axios from "axios";
import moment from "moment";

import queryString from "query-string";

import dealWithError from "./error.jsx";

import { extractDocAttrs } from "./../search/attrs.jsx";
import { createEmptyDoc, exctractDoc } from "./../doc/doc";
import { LocalCrypto } from "./../crypto/local.jsx";
import { base64 } from "./../util/base64.jsx";

const kHeaderAttrs = "x-node-attrs";
const kHeaderCreatedAt = "x-created-at";
const kHeaderLastModified = "last-modified";
const kHeaderContentType = "content-type";
const kHeaderLocalSecretId = "x-local-secret-id";
const kHeaderLocalSignature = "x-local-signature";
const kHeaderNodeMeta = "x-node-meta";

const kHeaderContentTypeUtf8 = "text/plain; charset=utf-8";

async function _tryToEncryptDocLocally(doc, attrs, account) {
  let value;
  let headers = { [kHeaderContentType]: kHeaderContentTypeUtf8 };
  const crypto = LocalCrypto.getInstance();
  if (crypto && crypto.has()) {
    const [encryptedDoc, encryptedAttrs] = await Promise.all([
      crypto.encryptObj(doc),
      crypto.encryptObj(attrs),
    ]);

    value = encryptedDoc.encrypted;
    headers[kHeaderLocalSecretId] = encryptedDoc.secret_id;
    headers[kHeaderLocalSignature] = encryptedDoc.signature;
    headers[kHeaderAttrs] = base64.fromObject(encryptedAttrs);
  } else {
    const jsonDoc = JSON.stringify(doc);
    value = jsonDoc;
    const jsonAttrs = base64.fromObject(attrs);
    headers[kHeaderAttrs] = jsonAttrs;
  }
  return {
    value: value,
    headers: headers,
  };
}

async function _tryToDecryptDocLocally(nid, data, headers, account) {
  if (kHeaderLocalSecretId in headers) {
    const secretId = headers[kHeaderLocalSecretId];
    if (!account) {
      return { doc: null, secret_id: secretId, success: false };
    }
    let crypto = account.getLocalCrypto();
    if (!crypto || !crypto.has(secretId)) {
      return { doc: null, secret_id: secretId, success: false };
    } else {
      // const encryptedAttrs = headers[kHeaderAttrs];
      const encryptedDoc = {
        encrypted: data,
        secret_id: secretId,
        signature: headers[kHeaderLocalSignature],
      };
      const doc = await crypto.decryptObj(encryptedDoc);
      return { doc: doc, secret_id: secretId, success: true };
    }
  }
  return { doc: exctractDoc(data, nid), secret_id: null, success: true };
}

async function createNode({
  doc,
  text,
  cancelToken,
  from_nid,
  to_nid,
  account,
}) {
  let query = {};
  if (from_nid) {
    query.from = from_nid;
  } else if (to_nid) {
    query.to = to_nid;
  }

  doc = doc || (text && exctractDoc(text, ".new")) || createEmptyDoc();
  const attrs = extractDocAttrs(doc);

  const { value, headers } = await _tryToEncryptDocLocally(doc, attrs, account);

  const config = {
    headers: headers,
    cancelToken: cancelToken,
  };

  return axios
    .post("/api/node/new?" + queryString.stringify(query), value, config)
    .then((resp) => {
      return resp.data ? resp.data : null;
    })
    .catch(dealWithError);
}

async function getNode({ nid, account, cancelToken }) {
  const res = await axios
    .get("/api/node/" + nid, {
      cancelToken: cancelToken,
    })
    .catch(dealWithError);
  if (!res) {
    return null;
  }
  const metaStr = res.headers[kHeaderNodeMeta];
  const meta = metaStr != null ? base64.toObject(metaStr) : {};
  const { doc, secret_id, success } = await _tryToDecryptDocLocally(
    nid,
    res.data,
    res.headers,
    account
  );
  return {
    nid: nid,
    doc: doc,
    created_at: moment(res.headers[kHeaderCreatedAt]),
    updated_at: moment(res.headers[kHeaderLastModified]),
    attrs: null,
    meta: meta,
    crypto: {
      secret_id: secret_id,
      success: success,
    },
  };
}

async function updateNode({ nid, doc, cancelToken, account }) {
  const attrs = extractDocAttrs(doc);
  const { value, headers } = await _tryToEncryptDocLocally(doc, attrs, account);
  const config = {
    headers: headers,
    cancelToken: cancelToken,
  };
  return axios.patch("/api/node/" + nid, value, config).catch(dealWithError);
}

function removeNode({ nid, cancelToken }) {}

export function getAuth({ cancelToken }) {
  return axios
    .get("/api/auth", { cancelToken: cancelToken })
    .catch(dealWithError);
}

export function getAnySecondKey() {
  return axios
    .post("/api/key/second/*")
    .then((res) => {
      return res.data;
    })
    .catch(dealWithError);
}

export function getSecondKey({ id }) {
  return axios
    .get("/api/key/second/" + id)
    .then((res) => {
      return res.data;
    })
    .catch(dealWithError);
}

async function decryptSecretAttrs(account, secretId, attrsEnc) {
  if (account) {
    let crypto = account.getLocalCrypto();
    if (crypto && crypto.has(secretId)) {
      // If this is encrypted blob, decrypt it first with local secret
      return await crypto.decryptObj(attrsEnc);
    }
  }
  return {};
}

async function nodeAttrsSearch({
  end_time,
  start_time,
  offset,
  cancelToken,
  account,
}) {
  const req = {
    end_time: end_time,
    start_time: start_time,
    offset: offset || 0,
  };
  const rawResp = await axios
    .post("/api/node-attrs-search", req, {
      cancelToken: cancelToken,
    })
    .catch(dealWithError);
  if (!rawResp) {
    return null;
  }
  let response = rawResp.data;
  response.items = await Promise.all(
    response.items.map(async (item) => {
      if (item.attrs) {
        const attrsEnc = base64.toObject(item.attrs);
        const secretId = attrsEnc.secret_id;
        if (secretId) {
          item.attrs = await decryptSecretAttrs(account, secretId, attrsEnc);
        } else {
          item.attrs = attrsEnc;
        }
      }
      return item;
    })
  );
  return response;
}

async function createEdge({ from, to, cancelToken }) {
  const req = {
    edges: [
      {
        from_nid: from,
        to_nid: to,
      },
    ],
  };
  return axios
    .post("/api/node/" + from + "/edge", req, {
      cancelToken: cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res && res.data && res.data.edges && res.data.edges.length > 0) {
        return res.data.edges[0];
      }
      return null;
    });
}

async function createFewEdges({ edges, cancelToken }) {
  const req = {
    edges: edges,
  };
  return axios
    .post("/api/node/some/edge", req, {
      cancelToken: cancelToken.token,
    })
    .then((res) => {
      if (res) {
        return res.data.edges;
      }
    });
}

async function getNodeEdges(nid, cancelToken, dir) {
  return axios
    .get("/api/node/" + nid + dir, {
      cancelToken: cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res) {
        return res.data;
      }
      return null;
    });
}

async function getEdgesToNode({ nid, cancelToken }) {
  return await getNodeEdges(nid, cancelToken, "/to");
}

async function getEdgesFromNode({ nid, cancelToken }) {
  return await getNodeEdges(nid, cancelToken, "/from");
}

async function getNodeMeta({ nid, cancelToken }) {
  return await axios
    .get("/api/node/" + nid + "/meta", {
      cancelToken: cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res && res.data) {
        return res.data;
      }
    });
}

async function updateNodeMeta({ nid, meta, cancelToken }) {
  const req = {
    meta: meta,
  };
  return await axios
    .patch("/api/node/" + nid + "/meta", req, {
      cancelToken: cancelToken,
    })
    .catch(dealWithError)
    .then((res) => {
      if (res && res.data) {
        return res.data;
      }
    });
}

export const smugler = {
  getAnySecondKey: getAnySecondKey,
  getAuth: getAuth,
  getSecondKey: getSecondKey,
  node: {
    get: getNode,
    update: updateNode,
    remove: removeNode,
    create: createNode,
    slice: nodeAttrsSearch,
  },
  edge: {
    create: createEdge,
    createFew: createFewEdges,
    getTo: getEdgesToNode,
    getFrom: getEdgesFromNode,
  },
  makeCancelToken: () => {
    return axios.CancelToken.source();
  },
  meta: {
    get: getNodeMeta,
    update: updateNodeMeta,
  },
};
