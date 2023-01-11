/**
 * Node-related APIs "on steroids" (see @alias steroid.ts for more information)
 */

import {
  GenerateBlobIndexResponse,
  NewNodeResponse,
  Nid,
  NodeCreatedVia,
  NodeIndexText,
  NodePatchRequest,
  TNode,
  UploadMultipartResponse,
} from '../types'
import {
  log,
  Mime,
  isAbortError,
  errorise,
  stabiliseUrlForOriginId,
  genOriginId,
} from 'armoury'
import type { Optional } from 'armoury'
import { CreateNodeArgs, GetNodeSliceArgs, StorageApi } from '../storage_api'
import { NodeUtil } from '../typesutil'
import lodash from 'lodash'

// TODO[snikitin@outlook.com] Those functions of this module which perform
// generation of a file search index share a lot of similarities
// with @see nodeIndexFromFile(). It may be beneficial if we can reuse one
// from another since right now new index-related features have to be implemented
// multiple times.

export type FileUploadComplete = {
  nid: string
  warning?: string
}

export type CreateNodeFromLocalBinaryArgs = {
  storage: StorageApi
  file: File
  from_nid: Optional<string>
  to_nid: Optional<string>
  createdVia: NodeCreatedVia
  abortSignal?: AbortSignal
}

/**
 * Upload a local binary file as a *fully featured* Mazed node
 * (as opposed to, for example, @see StorageApi.blob.upload that
 * at the time of this writing creates a node that *doesn't support some
 * Mazed features* like search index).
 */
export async function createNodeFromLocalBinary({
  storage,
  file,
  from_nid,
  to_nid,
  createdVia,
  abortSignal,
}: CreateNodeFromLocalBinaryArgs): Promise<FileUploadComplete> {
  const mime = Mime.fromString(file.type)
  if (!mime || !Mime.isImage(mime)) {
    throw new Error(
      `Attempted to upload a binary file of unsupported type ${file.type}`
    )
  }
  if (file.size > 8000000) {
    throw new Error(`reading failed: file is too big ( ${file.size} > 8MiB)`)
  }

  // Launch both upload & index *generation* at the same time, wait until all
  // promises are settled.
  const [uploadResult, indexResult] = await Promise.allSettled([
    storage.blob.upload(
      { files: [file], from_nid, to_nid, createdVia },
      abortSignal
    ),
    storage.blob_index.build([file], abortSignal),
  ])

  // If upload fails then what happens with index is not important as there is no
  // node to update with one
  if (uploadResult.status === 'rejected') {
    if (isAbortError(uploadResult.reason)) {
      throw uploadResult.reason
    }
    throw new Error(`Submission failed: ${uploadResult.reason}`)
  }

  const upload: UploadMultipartResponse = uploadResult.value
  if (upload.nids.length !== 1) {
    log.debug(
      `Submission failed: unexpected number of uploaded nids = ${upload.nids.length}`
    )
    throw new Error(`Submission failed: internal error`)
  }
  const nid = upload.nids[0]

  const toIndexRelatedWarning = (error: Error) => {
    if (isAbortError(error)) {
      throw error
    }
    return {
      nid,
      warning:
        `Submission succeeded, but failed to generate search index ` +
        `(node will be accessible, but not searchable): ${error}`,
    }
  }

  // When upload succeeds, but index generation fails it's not a critical
  // error as user data is not lost & if index generation is attempted in the
  // future it may still succeed. There is however nothing to update on the
  // successfully created node
  if (indexResult.status === 'rejected') {
    return toIndexRelatedWarning(indexResult.reason)
  }

  const index: GenerateBlobIndexResponse = indexResult.value

  // If both upload & index generation have succeeded then resulting node
  // needs to be updated with generated index to make it searchable

  if (upload.nids.length !== 1 || index.indexes.length !== 1) {
    return toIndexRelatedWarning({
      name: 'logical-error',
      message:
        `Can't resolve which blob index is associated with which file` +
        ` (got ${index.indexes.length} indexes, ${upload.nids.length} upload results)`,
    })
  }

  const index_text: NodeIndexText = index.indexes[0].index
  try {
    await storage.node.update(
      {
        nid: upload.nids[0],
        index_text,
      },
      abortSignal
    )
    return { nid }
  } catch (error) {
    return toIndexRelatedWarning(errorise(error))
  }
}

export function isUniqueLookupKey(
  key: NodeLookupKey
): key is UniqueNodeLookupKey {
  if ('nid' in key || 'webBookmark' in key) {
    return true
  }
  return false
}

function lookupKeyOf(args: CreateNodeArgs): NodeLookupKey | undefined {
  // TODO[snikitin@outlook.com]: This ideally should match with NodeUtil.isWebBookmark(),
  // NodeUtil.isWebQuote() etc but unclear how to reliably do so.
  if (args.extattrs?.web?.url) {
    return { webBookmark: { url: args.extattrs.web.url } }
  } else if (args.extattrs?.web_quote?.url) {
    return { webQuote: { url: args.extattrs.web_quote.url } }
  }
  return undefined
}

export async function createOrUpdateNode(
  storage: StorageApi,
  args: CreateNodeArgs,
  signal?: AbortSignal
): Promise<NewNodeResponse> {
  const lookupKey = lookupKeyOf(args)
  if (!lookupKey || !isUniqueLookupKey(lookupKey)) {
    throw new Error(
      `Attempt was made to create a node or, if it exists, update it, ` +
        `but the input node used look up key ${JSON.stringify(lookupKey)} ` +
        `that is not unique, which makes it impossible to correctly handle the 'update' case`
    )
  }
  const existingNode: TNode | undefined = await lookupNodes(storage, lookupKey)

  if (!existingNode) {
    return storage.node.create(args, signal)
  }

  const diff = describeWhatWouldPreventNodeUpdate(args, existingNode)
  if (diff) {
    throw new Error(
      `Failed to update node ${existingNode.nid} because some specified fields ` +
        `do not support update:\n${diff}`
    )
  }

  const patch: NodePatchRequest = {
    text: args.text,
    index_text: args.index_text,
  }

  await storage.node.update({ nid: existingNode.nid, ...patch }, signal)
  return { nid: existingNode.nid }
}

/**
 * At the time of this writing some datapoints that can be specified at
 * node creation can't be modified at node update due to API differences
 * (@see CreateNodeArgs and @see UpdateNodeArgs).
 * This presents a problem for @see createOrUpdate because some of the datapoints
 * caller passed in will be ignored in 'update' case, which is not obvious
 * and would be unexpected by the caller.
 * As a hack this helper tries to check if these datapoints are actually
 * different from node's current state. If they are the same then update will
 * not result in anything unexpected.
 */
function describeWhatWouldPreventNodeUpdate(args: CreateNodeArgs, node: TNode) {
  let diff = ''
  const extattrsFieldsOfLittleConsequence = ['description']
  const updatableExtattrsFields = ['text', 'index_text']
  for (const field in args.extattrs) {
    const isTargetField = (v: string) => v === field
    const isNonUpdatable =
      updatableExtattrsFields.findIndex(isTargetField) === -1
    const isOfLittleConsequence =
      extattrsFieldsOfLittleConsequence.findIndex(isTargetField) !== -1
    if (!isNonUpdatable || isOfLittleConsequence) {
      continue
    }
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'NodeExtattrs'
    const lhs = args.extattrs[field]
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'NodeExtattrs'
    const rhs = node.extattrs[field]
    if (!lodash.isEqual(lhs, rhs)) {
      diff +=
        `\n\textattrs.${field} - ` +
        `${JSON.stringify(lhs)} vs ${JSON.stringify(rhs)}`
    }
  }
  if (args.ntype !== node.ntype) {
    diff += `\n\tntype - ${JSON.stringify(args.ntype)} vs ${JSON.stringify(
      node.ntype
    )}`
  }
  // At the time of this writing some datapoints that can be set on
  // creation of a node do not get sent back when nodes are later retrieved
  // from smuggler. That makes it difficult to verify if values in 'args' differ
  // from what's stored on smuggler side or not. A conservative validation
  // strategy is used ("if a value is set, treat is as an error") to cut corners.
  if (args.from_nid) {
    diff += `\n\tfrom_nid - ${args.from_nid} vs (data not exposed via smuggler)`
  }
  if (args.to_nid) {
    diff += `\n\tto_nid - ${args.to_nid} vs (data not exposed via smuggler)`
  }

  if (!diff) {
    return null
  }

  return `[what] - [attempted update arg] vs [existing node value]: ${diff}`
}

/**
 * Unique lookup keys that can match at most 1 node
 */
export type UniqueNodeLookupKey =
  /** Due to nid's nature there can be at most 1 node with a particular nid */
  | { nid: Nid }
  /** Unique because many nodes can refer to the same URL, but only one of them
   * can be a bookmark */
  | { webBookmark: { url: string } }

export type NonUniqueNodeLookupKey =
  /** Can match more than 1 node because multiple parts of a single web page
   * can be quoted */
  | { webQuote: { url: string } }
  /** Can match more than 1 node because many nodes can refer to
   * the same URL:
   *    - 0 or 1 can be @see NoteType.Url
   *    - AND at the same time more than 1 can be @see NodeType.WebQuote */
  | { url: string }

/**
 * All the different types of keys that can be used to identify (during lookup,
 * for example) one or more nodes.
 */
export type NodeLookupKey = UniqueNodeLookupKey | NonUniqueNodeLookupKey

export async function lookupNodes(
  storage: StorageApi,
  key: UniqueNodeLookupKey,
  signal?: AbortSignal
): Promise<TNode | undefined>
export async function lookupNodes(
  storage: StorageApi,
  key: NonUniqueNodeLookupKey,
  signal?: AbortSignal
): Promise<TNode[]>
export async function lookupNodes(
  storage: StorageApi,
  key: NodeLookupKey,
  signal?: AbortSignal
): Promise<TNode[] | TNode | undefined>
export async function lookupNodes(
  storage: StorageApi,
  key: NodeLookupKey,
  signal?: AbortSignal
): Promise<TNode[] | TNode | undefined> {
  const SLICE_ALL = {
    start_time: 0, // since the beginning of time
    bucket_time_size: 366 * 24 * 60 * 60,
  }
  if ('nid' in key) {
    return storage.node.get({ nid: key.nid, signal })
  } else if ('webBookmark' in key) {
    const { id, stableUrl } = genOriginId(key.webBookmark.url)
    const query: GetNodeSliceArgs = { ...SLICE_ALL, origin: { id } }
    const iter = storage.node.slice(query)

    for (let node = await iter.next(); node != null; node = await iter.next()) {
      const nodeUrl = node.extattrs?.web?.url
      if (nodeUrl && stabiliseUrlForOriginId(nodeUrl) === stableUrl) {
        return node
      }
    }
    return undefined
  } else if ('webQuote' in key) {
    const { id, stableUrl } = genOriginId(key.webQuote.url)
    const query: GetNodeSliceArgs = { ...SLICE_ALL, origin: { id } }
    const iter = storage.node.slice(query)

    const nodes: TNode[] = []
    for (let node = await iter.next(); node != null; node = await iter.next()) {
      if (NodeUtil.isWebQuote(node) && node.extattrs?.web_quote) {
        if (
          stabiliseUrlForOriginId(node.extattrs.web_quote.url) === stableUrl
        ) {
          nodes.push(node)
        }
      }
    }
    return nodes
  } else if ('url' in key) {
    const { id, stableUrl } = genOriginId(key.url)
    const query: GetNodeSliceArgs = { ...SLICE_ALL, origin: { id } }
    const iter = storage.node.slice(query)

    const nodes: TNode[] = []
    for (let node = await iter.next(); node != null; node = await iter.next()) {
      if (NodeUtil.isWebBookmark(node) && node.extattrs?.web) {
        if (stabiliseUrlForOriginId(node.extattrs.web.url) === stableUrl) {
          nodes.push(node)
        }
      }
    }
    return nodes
  }

  throw new Error(`Failed to lookup nodes, unsupported key ${key}`)
}
