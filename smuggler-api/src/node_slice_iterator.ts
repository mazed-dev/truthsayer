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
    this.batch_start_time = start_time || Math.ceil(Date.now() / 1000)
    this.batch_offset = 0
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
      (!!limit && limit <= total_counter) ||
      (!!batch_end_time && batch_end_time < _kEarliestCreationTime)
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
    const resp = await fetcher({
      ...makeFetchLimits(
        batch_start_time,
        batch_end_time,
        batch_offset,
        this.batch_nodes.length,
        bucket_full_size
      ),
      limit: limit ? limit - total_counter : null,
      origin,
      signal,
    })
    this.batch_nodes = resp.nodes
    this.batch_offset = resp.offset
    this.batch_start_time = resp.start_time
    this.batch_end_time = resp.end_time

    this.bucket_full_size = resp.full_size
    return resp.nodes.length > 0
  }

  async next(): Promise<Optional<TNode>> {
    let { next_index } = this
    if (next_index >= this.batch_nodes.length) {
      while (!this.exhausted()) {
        if (await this._fetch()) {
          break
        }
      }
      if (this.exhausted()) {
        return null
      }
      next_index = 0
    }
    this.next_index = next_index + 1
    this.total_counter += 1
    return this.batch_nodes[next_index]
  }
}

function makeFetchLimits(
  start_time: number,
  end_time: number,
  offset: number,
  bufferLen: number,
  bucketFullSize: number
): {
  start_time: Optional<number>
  end_time: number
  offset: number
} {
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
