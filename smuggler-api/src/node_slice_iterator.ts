import { getNodesSlice } from './api'
import { TNode, NodeOrigin } from './types'

import { Optional } from './util/optional'

export interface INodeIterator {
  next: () => Promise<Optional<TNode>>
  total: () => number
  exhausted: () => boolean
}

export class TNodeSliceIterator implements INodeIterator {
  batch_nodes: TNode[]
  batch_start_time: number
  batch_end_time: number
  batch_offset: number
  bucket_full_size: number

  signal?: AbortSignal
  fetcher: typeof getNodesSlice
  limit?: number
  origin?: NodeOrigin

  next_index: number
  total_counter: number

  constructor(
    fetcher: typeof getNodesSlice,
    signal?: AbortSignal,
    start_time?: number,
    end_time?: number,
    limit?: number,
    origin?: NodeOrigin
  ) {
    this.batch_nodes = []
    this.batch_end_time = end_time || Math.ceil(Date.now() / 1000)
    if (start_time != null) {
      this.batch_start_time = start_time
    } else {
      this.batch_start_time = Math.ceil(Date.now() / 1000)
    }
    this.batch_offset = -1 // For the fist batch
    this.bucket_full_size = 0

    this.next_index = 0
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
    const { batch_end_time, total_counter, limit } = this
    return (
      (limit != null && limit <= total_counter) ||
      (batch_end_time != null && batch_end_time < _kEarliestCreationTime)
    )
  }

  async _fetch(): Promise<boolean> {
    const {
      batch_start_time,
      batch_end_time,
      batch_offset,
      bucket_full_size,
      fetcher,
      signal,
      limit,
      origin,
      total_counter,
    } = this
    const range = makeFetchLimits(
      batch_start_time,
      batch_end_time,
      batch_offset,
      this.batch_nodes.length,
      bucket_full_size
    )
    if (range.end_time <= _kEarliestCreationTime) {
      return this._acceptNextBatch({
        nodes: [],
        full_size: 0,
        offset: 0,
        start_time: 0,
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
    start_time,
    end_time,
  }: {
    nodes: TNode[]
    full_size: number
    offset: number
    start_time: number
    end_time: number
  }): boolean {
    this.batch_nodes = nodes
    this.batch_offset = offset
    this.batch_start_time = start_time
    this.batch_end_time = end_time
    this.bucket_full_size = full_size
    return nodes.length > 0
  }

  async next(): Promise<Optional<TNode>> {
    const { next_index } = this
    if (this.exhausted()) {
      return null
    }
    if (next_index < this.batch_nodes.length) {
      this.next_index = next_index + 1
      this.total_counter += 1
      return this.batch_nodes[next_index]
    }
    while (!(await this._fetch())) {
      if (this.exhausted()) {
        return null
      }
    }
    this.next_index = 0
    return await this.next()
  }
}

function makeFetchLimits(
  start_time: number,
  end_time: number,
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
      start_time,
      end_time,
      offset: 0,
    }
  }
  const currentBufferPosition = bufferLen + offset
  if (currentBufferPosition < bucketFullSize) {
    // Bucket is not yet exhausted, continue with with it shifting the offset
    return {
      start_time,
      end_time,
      offset: currentBufferPosition,
    }
  } else {
    // Bucket is exhausted, continue with a next one shifting time limits
    // --------|-------|---> time
    //       start    end
    return {
      start_time: start_time - _kSearchWindowSeconds,
      end_time: start_time,
      offset: 0,
    }
  }
}

const _kSearchWindowSeconds = 21 * 24 * 60 * 60
const _kEarliestCreationTime = 1576770000
