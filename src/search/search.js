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

export function buildIndex(nodes) {
  var nGramIndex = {};
  var nodeByNid = {};
  nodes.forEach((node) => {
    const nid = node.nid;
    nodeByNid[nid] = node;

    if (node.attrs && node.attrs.ngrams) {
      node.attrs.ngrams.forEach((ngr) => {
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
    nodeByNid: nodeByNid,
  };
}

export function searchNodesInAttrs(nodes, ngrams) {
  if (!ngrams || ngrams.length === 0) {
    //*dbg*/ console.log("Shortcut for empty search");
    return nodes;
  }

  const { nGramIndex, nodeByNid } = buildIndex(nodes);

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
  return nids
    .filter((nid) => {
      return frequency[nid] >= frequencyMax;
    })
    .map((nid) => {
      return nodeByNid[nid];
    });
}
