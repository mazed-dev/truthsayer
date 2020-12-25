import axios from "axios";

import queryString from "query-string";

import { packDocAttrs, kAttrsHeaderKey } from "./../search/attrs.js";
import { parseRawSource } from "./../doc/chunks.js";

import { createEmptyDoc } from "./../doc/doc";

function createNode({ doc, text, cancelToken, from_nid, to_nid }) {
  doc = doc || (text && parseRawSource(text)) || createEmptyDoc();

  const jsonDoc = JSON.stringify(doc);
  const attrsStr = packDocAttrs(doc);

  let query = {};
  if (from_nid) {
    query.from = from_nid;
  } else if (to_nid) {
    query.to = to_nid;
  }

  const config = {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      [kAttrsHeaderKey]: attrsStr,
    },
    cancelToken: cancelToken,
  };

  return axios.post(
    "/api/node/new?" + queryString.stringify(query),
    jsonDoc,
    config
  );
}

function getNode({ nid, cancelToken }) {
  return axios.get("/api/node/" + nid, {
    cancelToken: cancelToken,
  });
}

function updateNode({ nid, doc, cancelToken }) {
  const jsonDoc = JSON.stringify(doc);
  const attrsStr = packDocAttrs(doc);
  //*dbg*/ console.log("Doc attrs packed", attrsStr.length, attrsStr);
  const config = {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      [kAttrsHeaderKey]: attrsStr,
    },
    cancelToken: cancelToken,
  };
  return axios.patch("/api/node/" + nid, jsonDoc, config);
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

export const smugler = {
  getAnySecondKey: getAnySecondKey,
  getAuth: getAuth,
  getSecondKey: getSecondKey,
  node: {
    get: getNode,
    update: updateNode,
    remove: removeNode,
    create: createNode,
  },
};
