import { TNodeSliceIterator } from './node_slice_iterator'
import {
  TNode,
  NodeTextData,
  NodeMeta,
  NodeExtattrs,
  NodeIndexText,
} from './types'
import { Optional } from './util/optional'

import moment from 'moment'

const kNtype = 0
const kText: NodeTextData = { slate: [], draft: undefined, chunks: undefined }
const kCreatedAt = moment()
const kUpdatedAt = moment()
const kMeta: Optional<NodeMeta> = null
const kExtattrs: Optional<NodeExtattrs> = null
const kIndexText: Optional<NodeIndexText> = null
const kCrypto = { success: true, secret_id: null }

function makeNode(nid: string): TNode {
  return new TNode(
    nid,
    kNtype,
    kText,
    kCreatedAt,
    kUpdatedAt,
    kMeta,
    kExtattrs,
    kIndexText,
    kCrypto
  )
}

function ensureEndTime(end_time: Optional<number>): number {
  return end_time || Math.ceil(Date.now() / 1000)
}

function ensureStartTime(
  start_time: Optional<number>,
  end_time: number
): number {
  return start_time || (end_time - 1000)
}

test('TNodeSliceIterator next() -> [1]', async () => {
  let total = 0
  const fetcher = async ({
    end_time,
    start_time,
    offset,
    limit,
    signal,
  }: {
    end_time: Optional<number>
    start_time: Optional<number>
    offset: Optional<number>
    limit: Optional<number>
    signal?: AbortSignal
  }): Promise<{
    nodes: TNode[]
    full_size: number
    offset: number
    start_time: number
    end_time: number
  }> => {
    expect(offset).toStrictEqual(0)
    end_time = ensureEndTime(end_time)
    start_time = ensureStartTime(start_time, end_time)
    return {
      nodes: [makeNode((++total).toString())],
      full_size: 1,
      offset: 0,
      start_time,
      end_time,
    }
  }
  const iter = new TNodeSliceIterator(fetcher, undefined, undefined, undefined)
  for (const x of Array(9).keys()) {
    const node = await iter.next()
    expect(node).not.toBeNull()
    expect(node?.nid).toStrictEqual(iter.total().toString())
    expect(iter.total()).toStrictEqual(x + 1)
  }
})

test('TNodeSliceIterator next() -> [>1]', async () => {
  let total = 0
  const fetcher = async ({
    end_time,
    start_time,
    offset,
    limit,
    signal,
  }: {
    end_time: Optional<number>
    start_time: Optional<number>
    offset: Optional<number>
    limit: Optional<number>
    signal?: AbortSignal
  }): Promise<{
    nodes: TNode[]
    full_size: number
    offset: number
    start_time: number
    end_time: number
  }> => {
    expect(offset).toStrictEqual(0)
    const nodes = [
      makeNode((++total).toString()),
      makeNode((++total).toString()),
      makeNode((++total).toString()),
      makeNode((++total).toString()),
      makeNode((++total).toString()),
    ]
    end_time = ensureEndTime(end_time)
    start_time = ensureStartTime(start_time, end_time)
    return {
      nodes,
      full_size: nodes.length,
      offset: 0,
      start_time,
      end_time,
    }
  }
  const iter = new TNodeSliceIterator(fetcher, undefined, undefined, undefined)
  for (const x of Array(9).keys()) {
    const node = await iter.next()
    expect(node).not.toBeNull()
    expect(iter.total()).toStrictEqual(x + 1)
    expect(node?.nid).toStrictEqual((x + 1).toString())
  }
})

test('TNodeSliceIterator next() -> [>1] with limit', async () => {
  let total = 0
  const fetcher = async ({
    end_time,
    start_time,
    offset,
    limit,
    signal,
  }: {
    end_time: Optional<number>
    start_time: Optional<number>
    offset: Optional<number>
    limit: Optional<number>
    signal?: AbortSignal
  }): Promise<{
    nodes: TNode[]
    full_size: number
    offset: number
    start_time: number
    end_time: number
  }> => {
    expect(offset).toStrictEqual(0)
    const nodes: TNode[] = []
    for (const _i of Array(Math.min(limit || 5, 5)).keys()) {
      nodes.push(makeNode((++total).toString()))
    }
    end_time = ensureEndTime(end_time)
    start_time = ensureStartTime(start_time, end_time)
    return {
      nodes,
      full_size: nodes.length,
      offset: 0,
      start_time,
      end_time,
    }
  }
  const limit = 11
  const iter = new TNodeSliceIterator(
    fetcher,
    undefined,
    undefined,
    undefined,
    limit
  )
  for (const x of Array(limit).keys()) {
    const node = await iter.next()
    expect(node?.nid).toStrictEqual(iter.total().toString())
    expect(node).not.toBeNull()
    expect(iter.total()).toStrictEqual(x + 1)
  }
  const node = await iter.next()
  expect(node).toBeNull()
})

test('TNodeSliceIterator next() -> [>1] with offset', async () => {
  let total = 0
  const fetcher = async ({
    end_time,
    start_time,
    offset,
    limit,
    signal,
  }: {
    end_time: Optional<number>
    start_time: Optional<number>
    offset: Optional<number>
    limit: Optional<number>
    signal?: AbortSignal
  }): Promise<{
    nodes: TNode[]
    full_size: number
    offset: number
    start_time: number
    end_time: number
  }> => {
    const nodes: TNode[] = []
    const full_size = 8
    offset = offset || 0
    for (const _i of Array(Math.min(3, full_size - offset)).keys()) {
      nodes.push(makeNode((++total).toString()))
    }
    end_time = ensureEndTime(end_time)
    start_time = ensureStartTime(start_time, end_time)
    return {
      nodes,
      full_size,
      offset,
      start_time,
      end_time,
    }
  }
  // Expect fetch in 3 buckets in 3 batches each:
  //       [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ... ]
  // Batches |<- ->|  |<- ->|  |<>|  |<-   ->|  |<-    ->|  |<-->|  |<-    ->|  |<-
  // Buckets |<-   bucket 0     ->|  |<-     bucket 1          ->|  |<-  bucket 2
  const iter = new TNodeSliceIterator(fetcher, undefined, undefined, undefined)
  for (const x of Array(20).keys()) {
    const node = await iter.next()
    expect(node).not.toBeNull()
    expect(node?.nid).toStrictEqual(iter.total().toString())
    expect(iter.total()).toStrictEqual(x + 1)
  }
})

test.only('TNodeSliceIterator next() -> until exhausted', async () => {
  // Once exhausted it should always return null
  // Also it have not to fall into infinite loop there!
  let total = 0
  const fetcher = async ({
    end_time,
    start_time,
    offset,
    limit,
    signal,
  }: {
    end_time: Optional<number>
    start_time: Optional<number>
    offset: Optional<number>
    limit: Optional<number>
    signal?: AbortSignal
  }): Promise<{
    nodes: TNode[]
    full_size: number
    offset: number
    start_time: number
    end_time: number
  }> => {
    const nodes: TNode[] = []
    if (total < 10) {
      nodes.push(makeNode((++total).toString()))
    }
    const full_size = nodes.length
    offset = offset || 0
    end_time = ensureEndTime(end_time)
    start_time = ensureStartTime(start_time, end_time)
    return {
      nodes,
      full_size,
      offset,
      start_time,
      end_time,
    }
  }
  const iter = new TNodeSliceIterator(fetcher, undefined, undefined, undefined)
  for (const x of Array(10).keys()) {
    const node = await iter.next()
    expect(node).not.toBeNull()
    expect(node?.nid).toStrictEqual(iter.total().toString())
    expect(iter.total()).toStrictEqual(x + 1)
  }
  for (const _i of Array(9).keys()) {
    const node = await iter.next()
    expect(node).toBeNull()
  }
}, 10)
