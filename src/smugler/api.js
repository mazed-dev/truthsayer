import axios from "axios";

import queryString from "query-string";

import { packDocAttrs, kAttrsHeaderKey } from "./../search/attrs.js";
import { parseRawSource } from "./../doc/chunks.js";

export function createTextNode({ text, cancelToken, from_nid, to_nid }) {
  var query = {};
  if (from_nid) {
    query.from = from_nid;
  } else if (to_nid) {
    query.to = to_nid;
  }

  var doc = parseRawSource(text);
  const jsonDoc = JSON.stringify(doc);
  const attrsStr = packDocAttrs(doc);

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

export function fetchNode({ nid, cancelToken }) {
  return axios.get("/api/node/" + nid, {
    cancelToken: cancelToken,
  });
}

export function updateNode({ nid, doc, cancelToken }) {
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

export function getAuth({ cancelToken }) {
  return axios.get("/api/auth", { cancelToken: cancelToken });
}

export function getAnySecondKey() {
  return axios.get("/api/key/second/*");
}

export function getSecondKey({ id }) {
  return axios.get("/api/key/second/" + id);
}
