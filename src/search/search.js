import { loadAll, storeOne } from "./cache.js";
import {
  extractIndexNGramsFromDoc,
  extractIndexNGramsFromText,
  invertNidIndex,
} from "./ngramsIndex.js";

export function updateDocInIndex(nid, doc) {
  const ngrams = extractIndexNGramsFromDoc(doc);
  storeOne(nid, ngrams);
}

export function searchByText(txt) {
  if (!txt) {
    return [];
  }
  const ngrams = extractIndexNGramsFromText(txt);
  const nidToNgramsIndex = loadAll();
  const ngramsIndex = invertNidIndex(nidToNgramsIndex, null);

  var frequencyMax = -1;
  var frequency = {};

  var nids = ngrams
    .map((ngr) => {
      return ngramsIndex[ngr] || [];
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
  nids = nids.filter((nid) => {
    return frequency[nid] >= frequencyMax;
  });
  //*dbg*/ console.log("searchByText - found", txt, frequencyMax, ngrams.length, nids);
  return nids;
}
