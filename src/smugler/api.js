import axios from "axios";
import moment from "moment";

import queryString from "query-string";

import { extractDocAttrs } from "./../search/attrs.jsx";
import { createEmptyDoc, exctractDoc } from "./../doc/doc";
import { LocalCrypto } from "./../crypto/local.jsx";
import { TNode, TNodeAttrs } from "./types.jsx";
import { base64 } from "./../util/base64.jsx";

const kHeaderAttrs = "x-node-attrs";
const kHeaderCreatedAt = "x-created-at";
const kHeaderLastModified = "last-modified";
const kHeaderContentType = "content-type";
const kHeaderLocalSecretId = "x-local-secret-id";
const kHeaderLocalSignature = "x-local-signature";

const kHeaderContentTypeUtf8 = "text/plain; charset=utf-8";

async function _tryToEncryptDocLocally(doc, attrs) {
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

async function _tryToDecryptDocLocally(nid, data, headers, crypto) {
  if (kHeaderLocalSecretId in headers) {
    const secretId = headers[kHeaderLocalSecretId];
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

async function createNode({ doc, text, cancelToken, from_nid, to_nid }) {
  let query = {};
  if (from_nid) {
    query.from = from_nid;
  } else if (to_nid) {
    query.to = to_nid;
  }

  doc = doc || (text && exctractDoc(text, ".new")) || createEmptyDoc();
  const attrs = extractDocAttrs(doc);

  const { value, headers } = await _tryToEncryptDocLocally(doc, attrs);

  const config = {
    headers: headers,
    cancelToken: cancelToken,
  };

  return axios.post(
    "/api/node/new?" + queryString.stringify(query),
    value,
    config
  );
}

async function getNode({ nid, crypto, cancelToken }) {
  const res = await axios.get("/api/node/" + nid, {
    cancelToken: cancelToken,
  });
  if (!res) {
    return null;
  }
  const { doc, secret_id, success } = await _tryToDecryptDocLocally(
    nid,
    res.data,
    res.headers,
    crypto || LocalCrypto.getInstance()
  );
  return {
    nid: nid,
    doc: doc,
    created_at: moment(res.headers[kHeaderCreatedAt]),
    updated_at: moment(res.headers[kHeaderLastModified]),
    attrs: null,
    crypto: {
      secret_id: secret_id,
      success: success,
    },
  };
}

async function updateNode({ nid, doc, cancelToken }) {
  const attrs = extractDocAttrs(doc);
  const { value, headers } = await _tryToEncryptDocLocally(doc, attrs);
  const config = {
    headers: headers,
    cancelToken: cancelToken,
  };
  return axios.patch("/api/node/" + nid, value, config);
}

function removeNode({ nid, cancelToken }) {}

export function getAuth({ cancelToken }) {
  return axios.get("/api/auth", { cancelToken: cancelToken });
}

export function getAnySecondKey() {
  return axios.post("/api/key/second/*").then((res) => {
    return res.data;
  });
}

export function getSecondKey({ id }) {
  return axios.get("/api/key/second/" + id).then((res) => {
    return res.data;
  });
}

async function nodeAttrsSearch({
  updateAfterDays,
  updateBeforeDays,
  offset,
  cancelToken,
  crypto,
}) {
  const req = {
    upd_after: updateAfterDays,
    upd_before: updateBeforeDays,
    offset: offset || 0,
  };
  const rawResp = await axios.post("/api/node-attrs-search", req, {
    cancelToken: cancelToken,
  });
  if (!rawResp) {
    return null;
  }
  let response = rawResp.data;
  crypto = crypto || LocalCrypto.getInstance();
  response.items = await Promise.all(
    response.items.map(async (item) => {
      if (item.attrs) {
        const attrsEnc = base64.toObject(item.attrs);
        const secretId = attrsEnc.secret_id;
        if (secretId) {
          if (crypto.has(secretId)) {
            // If this is encrypted blob, decrypt it first with local secret
            item.attrs = await crypto.decryptObj(attrsEnc);
          } else {
            item.attrs = {};
          }
        } else {
          item.attrs = attrsEnc;
        }
      }
      return item;
    })
  );
  return response;
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
};
