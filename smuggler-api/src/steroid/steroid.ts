/**
 * @file smuggler-api "on steroids".
 *
 * Helpers to encapsulate business logic that makes sense a single,
 * non-client side action, but due to the structure of smuggler's REST API
 * has to be implemented
 *  - either as 2 or more REST calls
 *  - or 1 REST call, but the exact call or its data needs to be determined
 *  conditionally
 *
 * (as opposed to @alias storage_api.ts which is intended as a very thin Typescript
 * wrapper around individual smuggler's REST API)
 */

import { NodeCreateArgs, StorageApi } from '../storage_api'
import { TNode } from '../types'
import {
  nodeIndexFromFile,
  mimeTypeIsSupportedByBuildIndex,
} from './buildIndex'
import {
  createNodeFromLocalBinary,
  CreateNodeFromLocalBinaryArgs,
  lookupNodes,
  createOrUpdateNode,
  UniqueNodeLookupKey,
  NonUniqueNodeLookupKey,
  NodeLookupKey,
} from './node'

export const steroid = (storage: StorageApi) => {
  const lookup = ((key: NodeLookupKey, signal?: AbortSignal) =>
    lookupNodes(storage, key, signal)) as {
    // See https://stackoverflow.com/a/24222144/3375765
    // and https://stackoverflow.com/a/61366790/3375765 if you are unsure what
    // this type signature is
    (key: UniqueNodeLookupKey, signal?: AbortSignal): Promise<TNode | undefined>
    (key: NonUniqueNodeLookupKey, signal?: AbortSignal): Promise<TNode[]>
    (key: NodeLookupKey, signal?: AbortSignal): Promise<
      TNode[] | TNode | undefined
    >
  }

  return {
    build_index: {
      build: (file: File, signal?: AbortSignal) => {
        return nodeIndexFromFile(storage, file, signal)
      },
      cfg: {
        supportsMime: mimeTypeIsSupportedByBuildIndex,
      },
    },
    node: {
      createOrUpdate: (args: NodeCreateArgs, signal?: AbortSignal) =>
        createOrUpdateNode(storage, args, signal),
      /**
       * Lookup all the nodes that match a given key. For unique lookup keys either
       * 0 or 1 nodes will be returned. For non-unique more than 1 node can be returned.
       */
      lookup,
      // TODO[snikitin@outlook.com] See if this can be merged with
      // uploadLocalTextFile() to form a more general steroid.node.createFromLocal
      createFromLocalBinary: (
        args: Omit<CreateNodeFromLocalBinaryArgs, 'storage'>
      ) => createNodeFromLocalBinary({ ...args, storage }),
    },
  }
}
