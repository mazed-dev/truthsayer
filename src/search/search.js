import { loadAll, storeOne } from "./cache.js";
import {
  extractIndexNGramsFromDoc,
  extractIndexNGramsFromText,
} from "./ngramsIndex.js";

import { base64 } from "./../util/base64.jsx";

import moment from "moment";

export function updateDocInIndex(nid, doc) {
  const ngrams = extractIndexNGramsFromDoc(doc);
  storeOne(nid, ngrams);
}

function _unpackAttrs(attrsStr) {
  try {
    return base64.toObject(attrsStr);
  } catch (err) {
    console.log("Attribute unpack error: ", err);
  }
  return {};
}

export function buildIndex(attrs) {
  var nGramIndex = {};
  var attrsByNid = {};
  attrs.forEach((item) => {
    const nid = item.nid;
    attrsByNid[nid] = item;

    if (item.attrs && item.attrs.ngrams) {
      item.attrs.ngrams.forEach((ngr) => {
        if (!(ngr in nGramIndex)) {
          nGramIndex[ngr] = [nid];
        } else {
          nGramIndex[ngr].push(nid);
        }
      });
    }
  });
  return {
    // ngram -> [nid]
    nGramIndex: nGramIndex,
    // nid -> {ntype, crtd, upd, attrs}
    attrsByNid: attrsByNid,
  };
}

export function searchNodesInAttrs(nodeAttrs, ngrams) {
  if (!ngrams || ngrams.length === 0) {
    //*dbg*/ console.log("Shortcut for empty search");
    return nodeAttrs.map((item) => {
      return {
        nid: item.nid,
        preface: null,
        crtd: moment.unix(item.crtd),
        upd: moment.unix(item.upd),
        edges: [],
      };
    });
  }

  const { nGramIndex, attrsByNid } = buildIndex(nodeAttrs);

  var frequencyMax = -1;
  var frequency = {};

  var nids = ngrams
    .map((ngr) => {
      return nGramIndex[ngr] || [];
    })
    .flat()
    .filter((nid) => {
      if (nid in frequency) {
        frequency[nid] += 1;
        frequencyMax = Math.max(frequency[nid], frequencyMax);
        return false;
      }
      frequency[nid] = 1;
      return true;
    });
  frequencyMax = Math.min(ngrams.length - 2, frequencyMax);
  const nodes = nids
    .filter((nid) => {
      return frequency[nid] >= frequencyMax;
    })
    .map((nid) => {
      const attrs = attrsByNid[nid];
      return {
        nid: nid,
        preface: null,
        crtd: moment.unix(attrs.crtd),
        upd: moment.unix(attrs.upd),
        edges: [],
      };
    });
  //*dbg*/ console.log( "searchNodesInAttrs - found", nodes.length, frequencyMax, ngrams.length);
  return nodes;
}
