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
 * (as opposed to @alias api.ts which is intended as a very thin Typescript
 * wrapper around individual smuggler's REST API)
 */

import {
  nodeIndexFromFile,
  mimeTypeIsSupportedByBuildIndex,
} from './buildIndex'
import { createNodeFromLocalBinary } from './node'

export const steroid = {
  build_index: {
    build: nodeIndexFromFile,
    cfg: {
      supportsMime: mimeTypeIsSupportedByBuildIndex,
    },
  },
  node: {
    // TODO[snikitin@outlook.com] See if this can be merged with
    // uploadLocalTextFile() to form a more general steroid.node.createFromLocal
    createFromLocalBinary: createNodeFromLocalBinary,
  },
}
