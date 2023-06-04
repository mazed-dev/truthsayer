import { CachedKnnClassifier, YekLavStore } from './cachedKnnClassifier'
import browser from 'webextension-polyfill'
import { NodeSimilaritySearchSignatureLatest } from 'smuggler-api'
import * as tf from '@tensorflow/tfjs-node'

class TmpStorageArea implements browser.Storage.StorageArea {
  data = new Map<string, any>()

  async get(
    keys: Parameters<browser.Storage.StorageArea['get']>[0]
  ): Promise<Record<string, any>> {
    if (typeof keys !== 'string') {
      throw new Error(
        `TmpStorageArea has only implemented get() for string keys so far, but got '${typeof keys}'`
      )
    }
    return { [keys]: this.data.get(keys) }
  }
  async set(items: Record<string, any>) {
    for (const key in items) {
      await this.data.set(key, items[key])
    }
  }
  async remove(keys: string | string[]) {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      await this.data.delete(key)
    }
  }
  async clear() {
    this.data.clear()
  }
}

async function create(): Promise<{
  store: YekLavStore
  knn: CachedKnnClassifier
}> {
  const storage = new TmpStorageArea()
  return {
    store: new YekLavStore(storage),
    knn: await CachedKnnClassifier.create(
      storage,
      NodeSimilaritySearchSignatureLatest
    ),
  }
}

describe('CachedKnnClassifier', () => {
  const tensor = tf.tensor([1, 2, 3, 4])

  test('addExample caches input label', async () => {
    // GIVEN
    const { store, knn } = await create()
    // WHEN
    await knn.addExample(tensor, 'mylabel')
    // THEN
    expect(
      await store.get({ yek: { kind: 'label->class', key: 'mylabel' } })
    ).toBeTruthy()
  })
  test('clearClass clears cached label', async () => {
    // GIVEN
    const { store, knn } = await create()
    await knn.addExample(tensor, 'mylabel')
    // WHEN
    await knn.clearClass('mylabel')
    // THEN
    expect(
      await store.get({ yek: { kind: 'label->class', key: 'mylabel' } })
    ).toBeFalsy()
  })
})
