import type {
  NodeCreateArgs,
  NodeExtattrs,
  NodeIndexText,
  NodeTextData,
  SetNodeSimilaritySearchInfoArgs,
  StorageApi,
} from 'smuggler-api'
import { BackgroundPosthog } from './background/productanalytics'

/**
 * @summary A pass-through wrapper around a `StorageApi` that measures the
 * approximate size of the data being stored and reports to PostHog.
 *
 * @description This implementation has a lot of downsides, including precisionm
 * brittleness when data structures change etc. See https://github.com/mazed-dev/truthsayer/issues/686#issuecomment-1556181981
 * for more details on why such approach was chosen.
 *
 * @param impl a `StorageApi` to wrap
 */
export function meteredStorageApi(
  impl: StorageApi,
  analytics: BackgroundPosthog
): StorageApi {
  const EVENT_NAME: Readonly<string> = 'StorageApi: (approximate) memory usage'

  return {
    node: {
      get: (args, signal) => impl.node.get(args, signal),
      getByOrigin: (args, signal) => impl.node.getByOrigin(args, signal),
      getAllNids: (args, signal) => impl.node.getAllNids(args, signal),
      update: (args, signal) => impl.node.update(args, signal),
      create: (args, signal) => {
        analytics.capture(EVENT_NAME, {
          dataType: 'node',
          sizeBytes: ApproximateSizeOf.node.create(args),
        })
        return impl.node.create(args, signal)
      },
      iterate: () => impl.node.iterate(),
      delete: (args, signal) => impl.node.delete(args, signal),
      bulkDelete: (args, signal) => impl.node.bulkDelete(args, signal),
      batch: {
        get: (args, signal) => impl.node.batch.get(args, signal),
      },
      url: (nid) => impl.node.url(nid),
      addListener: (listener) => impl.node.addListener(listener),
      removeListener: (listener) => impl.node.removeListener(listener),
      similarity: {
        getIndex: (args, signal) => impl.node.similarity.getIndex(args, signal),
        setIndex: (args, signal) => {
          analytics.capture(EVENT_NAME, {
            dataType: 'similarity',
            sizeBytes: ApproximateSizeOf.node.similarity.setIndex(args),
          })
          return impl.node.similarity.setIndex(args, signal)
        },
      },
    },
    blob: {
      upload: (args, signal) => impl.blob.upload(args, signal),
      sourceUrl: (nid) => impl.blob.sourceUrl(nid),
    },
    blob_index: {
      build: (files, signal) => impl.blob_index.build(files, signal),
      cfg: {
        supportsMime: (mimeType) => impl.blob_index.cfg.supportsMime(mimeType),
      },
    },
    edge: {
      create: (args, signal) => impl.edge.create(args, signal),
      get: (args, signal) => impl.edge.get(args, signal),
      sticky: (args, signal) => impl.edge.sticky(args, signal),
      delete: (args, signal) => impl.edge.delete(args, signal),
    },
    activity: {
      external: {
        add: (args, signal) => impl.activity.external.add(args, signal),
        get: (args, signal) => impl.activity.external.get(args, signal),
      },
      association: {
        record: (args, signal) =>
          impl.activity.association.record(args, signal),
        get: (args, signal) => impl.activity.association.get(args, signal),
      },
    },
    external: {
      ingestion: {
        get: (args, signal) => impl.external.ingestion.get(args, signal),
        advance: (args, signal) =>
          impl.external.ingestion.advance(args, signal),
      },
    },
    account: {
      info: {
        get: (args) => impl.account.info.get(args),
        set: (args) => impl.account.info.set(args),
      },
    },
  }
}

/**
 * Approximate size of a plain-old-data JS types bytes.
 *
 * Note that this is a rough approximation, intended to be much precise than
 * `JSON.stringify`, but more performant.
 * See https://www.mattzeunert.com/2016/07/24/javascript-array-object-sizes.html
 * for more details on how much the JS types actually take up.
 */
const ApproxPod = {
  str: (str?: string): number => {
    // NOTE: JS strings seem to be UTF-16 encoded, so each character is *at least*
    // 2 bytes. See https://stackoverflow.com/a/11141331/3375765 for details.
    return (str?.length ?? 0) * 2
  },
  strArray: (arr?: string[]): number => {
    let ret = 0
    for (const str of arr ?? []) {
      ret += ApproxPod.str(str)
    }
    return ret
  },
  num: (num?: number): number => {
    // NOTE: JS numbers are always 64-bit floats.
    return num === undefined ? 0 : 8
  },
  numArray: (arr?: number[]): number => {
    return (arr?.length ?? 0) * ApproxPod.num(0)
  },
  /**
   * Intended as a way to explicitely highlight that a particular part
   * of a data structure is intentionally ignored.
   */
  ignore: (_: any): number => 0,
  /**
   * Intended as a way to explicitely highlight that a particular part
   * of a data structure is expected to be empty (as in `{}`) at the time of writing.
   */
  empty: (_: any): number => 0,
}

/**
 * Approximate size of a types custom to the application.
 *
 * Note that this is a rough approximation, intended to be much precise than
 * `JSON.stringify`, but more performant.
 */
const Approx = {
  NodeTextData: (data?: NodeTextData): number => {
    return (
      // At the time of this writing Slate is only used for hand-written
      // notes which originally made the bulk of user's data, but web
      // bookmarks took over as the primary data type over time.
      ApproxPod.ignore(data?.slate) +
      // `draft` is deprecated
      ApproxPod.ignore(data?.draft) +
      // `chunks` is deprecated
      ApproxPod.ignore(data?.chunks)
    )
  },
  NodeIndexText: (data?: NodeIndexText): number => {
    return (
      ApproxPod.str(data?.plaintext) +
      ApproxPod.strArray(data?.labels) +
      ApproxPod.strArray(data?.brands)
    )
  },
  NodeExtattrs: (data?: NodeExtattrs): number => {
    return (
      ApproxPod.str(data?.title) +
      ApproxPod.str(data?.description) +
      ApproxPod.str(data?.preview_image?.data) +
      ApproxPod.str(data?.web?.url) +
      ApproxPod.empty(data?.blob) +
      ApproxPod.str(data?.web_quote?.url) +
      ApproxPod.strArray(data?.web_quote?.path) +
      ApproxPod.str(data?.web_quote?.text)
    )
  },
}

const ApproximateSizeOf = {
  node: {
    create: (args: NodeCreateArgs) => {
      return (
        Approx.NodeTextData(args.text) +
        ApproxPod.strArray(args.from_nid) +
        ApproxPod.strArray(args.to_nid) +
        Approx.NodeIndexText(args.index_text) +
        Approx.NodeExtattrs(args.extattrs)
      )
    },
    similarity: {
      setIndex: (args: SetNodeSimilaritySearchInfoArgs) => {
        return (
          ApproxPod.str(args.nid) +
          ApproxPod.numArray(args.simsearch?.embeddingJson.data)
        )
      },
    },
  },
}
