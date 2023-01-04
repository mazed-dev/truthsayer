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

import { StorageApi } from '../storage_api'
import {
  nodeIndexFromFile,
  mimeTypeIsSupportedByBuildIndex,
} from './buildIndex'
import {
  createNodeFromLocalBinary,
  CreateNodeFromLocalBinaryArgs,
} from './node'

export const steroid = (storage: StorageApi) => {
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
      // TODO[snikitin@outlook.com] See if this can be merged with
      // uploadLocalTextFile() to form a more general steroid.node.createFromLocal
      createFromLocalBinary: (
        args: Omit<CreateNodeFromLocalBinaryArgs, 'storage'>
      ) => createNodeFromLocalBinary({ ...args, storage }),
    },
  }
}
