import { getNodesSlice } from './api'
import { TNode, NodeOrigin } from './types'

import { Optional } from './util/optional'

export interface INodeIterator {
  next: () => Promise<Optional<TNode>>
  total: () => number
  exhausted: () => boolean
}

// Iterates over nodes' slice fetched lazily in batches
//
// Terms:
//  Slice - range of nodes within give time inteval
//  Bucket - range of nodes within a time sub-inteval
//  Batch - subrange of nodes in a bucket, defined by offset in given bucket.
//
// For example:
//      [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22 ]
// Slice  |<----------------------------- slice ------------------------------------->|
// Bucket:|<------- bucket 0 -------->|  |<-------- bucket 1 ------------------------>|
// Batch: |<-batch 0->|  |<-batch 1 ->|  |<-batch 0 ->|  |<-batch 1 ->|  |<-batch 2 ->|
// Where
//  Slice:
//    slice_start_time: 1
//    (slice_end_time: 22)
//  Bucket 0:
//    (bucket_start_time=1)
//    bucket_end_time=11
//    batches:
//      0:
//        offset=0
//      1:
//        offset=5
//  Bucket 1:
//    (bucket_start_time=11)
//    bucket_end_time=22
//    batches:
//      0:
//        offset=0
//      1:
//        offset=4
//      2:
//        offset=8
export class TNodeSliceIterator implements INodeIterator {
  // Slice time range
  slice_start_time: number

  // Bucket time range
  bucket_end_time: number

  // Size of a bucket in seconds
  bucket_time_size: number

  // Bucket full size
  bucket_full_size: number

  // All nodes of a current batch
  batch_nodes: TNode[]
  // Offset of a batch in a bucket
  batch_offset: number
  // Index of a next node in batch_nodes to emit
  next_index_in_batch: number

  origin?: NodeOrigin

  signal?: AbortSignal
  fetcher: typeof getNodesSlice

  // Limits total number of nodes emitted
  limit?: number

  // Total number of nodes emitted
  total_counter: number

  constructor(
    fetcher: typeof getNodesSlice,
    signal?: AbortSignal,
    start_time?: number,
    end_time?: number,
    bucket_time_size?: number,
    limit?: number,
    origin?: NodeOrigin
  ) {
    this.slice_start_time = start_time || _kEarliestCreationTime
    this.bucket_time_size = bucket_time_size || _kBucketTimeSizeDefault
    if (end_time != null) {
      this.bucket_end_time = end_time
    } else {
      this.bucket_end_time = Math.ceil(Date.now() / 1000)
    }
    this.bucket_full_size = 0

    this.batch_offset = -1 // For the fist batch
    this.batch_nodes = []
    this.next_index_in_batch = 0

    this.total_counter = 0
    this.signal = signal
    this.fetcher = fetcher
    this.limit = limit
    this.origin = origin
  }

  total(): number {
    return this.total_counter
  }

  exhausted(): boolean {
    const { bucket_end_time, total_counter, limit } = this
    return (
      (limit != null && limit <= total_counter) ||
      (bucket_end_time != null && bucket_end_time <= this.slice_start_time)
    )
  }

  async _fetch(): Promise<boolean> {
    const {
      bucket_end_time,
      batch_offset,
      bucket_full_size,
      fetcher,
      signal,
      limit,
      origin,
      total_counter,
      bucket_time_size,
    } = this
    const range = makeFetchLimits(
      bucket_end_time,
      bucket_time_size,
      batch_offset,
      this.batch_nodes.length,
      bucket_full_size
    )
    if (range.end_time <= this.slice_start_time) {
      return this._acceptNextBatch({
        nodes: [],
        full_size: 0,
        offset: 0,
        end_time: 0,
      })
    }
    const resp = await fetcher({
      ...range,
      limit: limit ? limit - total_counter : null,
      origin,
      signal,
    })
    return this._acceptNextBatch(resp)
  }

  _acceptNextBatch({
    nodes,
    full_size,
    offset,
    end_time,
  }: {
    nodes: TNode[]
    full_size: number
    offset: number
    end_time: number
  }): boolean {
    this.batch_nodes = nodes
    this.batch_offset = offset
    this.bucket_end_time = end_time
    this.bucket_full_size = full_size
    return nodes.length > 0
  }

  async next(): Promise<Optional<TNode>> {
    const { next_index_in_batch } = this
    if (this.exhausted()) {
      return null
    }
    if (next_index_in_batch < this.batch_nodes.length) {
      this.next_index_in_batch = next_index_in_batch + 1
      this.total_counter += 1
      return this.batch_nodes[next_index_in_batch]
    }
    while (!(await this._fetch())) {
      if (this.exhausted()) {
        return null
      }
    }
    this.next_index_in_batch = 0
    return await this.next()
  }
}

function makeFetchLimits(
  bucket_end_time: number,
  bucket_time_size: number,
  offset: number,
  bufferLen: number,
  bucketFullSize: number
): {
  start_time: number
  end_time: number
  offset: number
} {
  if (offset < 0) {
    // First fetch only
    return {
      start_time: bucket_end_time - bucket_time_size,
      end_time: bucket_end_time,
      offset: 0,
    }
  }
  const currentBufferPosition = bufferLen + offset
  if (currentBufferPosition < bucketFullSize) {
    // Bucket is not yet exhausted, continue with with it shifting the offset
    return {
      start_time: bucket_end_time - bucket_time_size,
      end_time: bucket_end_time,
      offset: currentBufferPosition,
    }
  } else {
    // Bucket is exhausted, continue with a next one shifting time limits
    // --------|-------|---> time
    //       start    end
    bucket_end_time = bucket_end_time - bucket_time_size
    return {
      start_time: bucket_end_time - bucket_time_size,
      end_time: bucket_end_time,
      offset: 0,
    }
  }
}

const _kBucketTimeSizeDefault = 21 * 24 * 60 * 60
const _kEarliestCreationTime = 1576770000
