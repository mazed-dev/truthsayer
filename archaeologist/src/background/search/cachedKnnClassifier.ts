import { InterfaceOf, log } from 'armoury'
import lodash from 'lodash'
import { KNNClassifier, tf } from 'text-information-retrieval'
import browser from 'webextension-polyfill'

/**
 * If you need to clear the cache for local testing, run the following
 * in the background worker's console:
 * ```
 * chrome.storage.local.get().then((data)=> chrome.storage.local.remove(Object.keys(data).filter((key)=>key.startsWith("knn/"))))
 * ```
 *
 * If you need to print all the cached labels:
 * ```
 * chrome.storage.local.get().then((data)=> console.log(Object.keys(data).filter((key)=>key.startsWith("knn/"))))
 *
 * ```
 */

/** @see storage_api_browser_ext.GenericYek */
type GenericYek<Kind extends string, Key> = {
  yek: {
    kind: Kind
    key: Key
  }
}
/** @see storage_api_browser_ext.GenericLav */
type GenericLav<Kind extends string, Value, Auxiliary = undefined> = {
  lav: {
    kind: Kind
    value: Value
    /**
     * Additional data which due to various reasons (such as historical)
     * are not part of the core @see Value structure, but storing it alongside
     * is helpful for implementation of @see StorageApi.
     * As an alternative to a separate 'auxiliary' field, @see Value could
     * be augmented with extra fields itself, but that is avoided deliberately
     * to reduce chances of this "service" data leaking outside the StorageApi
     * implementation.
     */
    auxiliary?: Auxiliary
  }
}

/** 'label' is a @see KNNClassifier term */
type Label = number | string

type AllLabelsYek = GenericYek<'all-labels', undefined>
type AllLabelsLav = GenericLav<'all-labels', { label: Label }[]>

type LabelToClassYek = GenericYek<'label->class', Label>
type LabelToClassLav = GenericLav<
  'label->class',
  // See https://github.com/tensorflow/tfjs/issues/633#issuecomment-576218643
  // about how to properly serialize/deserialize @see KNNClassifier
  { data: number[]; shape: tf.Tensor['shape'] }
>

type CacheSignatureYek = GenericYek<'cache-signature', undefined>
type CacheSignatureLav = GenericLav<
  'cache-signature',
  {
    /**
     * 'signature' is expected to change when the code which *uses* @see CachedKnnClassifier
     * changes such that the shape or contents of the cached data is no longer valid
     */
    signature: string
    /**
     * 'internalVersion' is expected to be incremented when the code of the
     * @see CachedKnnClassifier itself changes such that the older cache would
     * no longer be valid
     */
    internalVersion?: number
  }
>

/**
 * NOTE: When adding a new yek here, don't forget to
 * extend @see dropCacheOnSignatureMismatch()!
 */
type Yek = AllLabelsYek | LabelToClassYek | CacheSignatureYek

type Lav = AllLabelsLav | LabelToClassLav | CacheSignatureLav

type YekLav = { yek: Yek; lav: Lav }

/** A copy-paste of @see storage_api_browser_ext.YekLavStore */
export class YekLavStore {
  private store: browser.Storage.StorageArea

  constructor(store: browser.Storage.StorageArea) {
    this.store = store
  }

  /** @see storage_api_browser_ext.YekLavStore.set */
  async set(items: YekLav[]): Promise<void> {
    for (const item of items) {
      if (item.yek.yek.kind !== item.lav.lav.kind) {
        throw new Error(
          `Attempted to set a key/value pair of mismatching kinds: '${item.yek.yek.kind}' !== '${item.lav.lav.kind}'`
        )
      }
    }
    let records: Record<string, any> = {}
    for (const item of items) {
      const key = this.stringify(item.yek)
      if (Object.keys(records).indexOf(key) !== -1) {
        throw new Error(`Attempted to set more than 1 value for key '${key}'`)
      }
      records[key] = item.lav
    }
    await this.store.set(records)
  }

  /** @see storage_api_browser_ext.YekLavStore.get */
  async get(yek: AllLabelsYek): Promise<AllLabelsLav | undefined>
  async get(yek: LabelToClassYek): Promise<LabelToClassLav | undefined>
  async get(
    yek: LabelToClassYek[]
  ): Promise<{ yek: LabelToClassYek; lav: LabelToClassLav }[]>
  async get(yek: CacheSignatureYek): Promise<CacheSignatureLav | undefined>
  async get(yek: Yek): Promise<Lav | undefined>
  async get(yek: Yek | Yek[]): Promise<Lav | YekLav[] | undefined> {
    if (Array.isArray(yek)) {
      const keyToYek = new Map<string, Yek>()
      yek.forEach((singleYek: Yek) =>
        keyToYek.set(this.stringify(singleYek), singleYek)
      )
      const keys: string[] = Array.from(keyToYek.keys())
      const records: Record<string, any> = await this.store.get(keys)
      const yeklavs: YekLav[] = []
      for (const [key, yek] of keyToYek) {
        const lav = key in records ? (records[key] as Lav) : undefined
        if (lav == null) {
          continue
        }
        yeklavs.push({ yek, lav })
      }
      return yeklavs
    }

    const key = this.stringify(yek)
    const records: Record<string, any> = await this.store.get(key)
    const record = records[key]
    return record != null ? (record as Lav) : undefined
  }

  /** @see storage_api_browser_ext.YekLavStore.prepareAppend */
  async prepareAppend(
    yek: AllLabelsYek,
    appended_lav: AllLabelsLav
  ): Promise<YekLav> {
    const lav = await this.get(yek)
    const value = lav?.lav.value ?? []
    value.push(...appended_lav.lav.value)
    // TODO[snikitin@outlook.com] I'm sure it's possible to convince Typescript
    // that below is safe, but don't know how
    return {
      yek,
      lav: {
        // @ts-ignore Type '{...}' is not assignable to type 'Lav'
        lav: {
          kind: yek.yek.kind,
          // @ts-ignore Each member of the union type has signatures, but none of those
          // signatures are compatible with each other
          value,
        },
      },
    }
  }

  async remove(yeks: Yek[]): Promise<void> {
    return this.store.remove(yeks.map(this.stringify))
  }

  /**
   *
   * @param yek A yek that points to a lav from which the data should be removed
   * @param criteria Criteria (similar to a predicate) of which values should
   * be removed from a lav assosiated with the input yek
   */
  async prepareRemoval(yek: AllLabelsYek, criteria: Label[]): Promise<YekLav> {
    const lav = await this.get(yek)
    const value = lav?.lav.value ?? []
    lodash.remove(
      value,
      ({ label }: { label: Label }) => criteria.indexOf(label) !== -1
    )

    return {
      yek,
      lav: {
        // @ts-ignore Types of property 'kind' are incompatible
        lav: {
          kind: yek.yek.kind,
          value,
        },
      },
    }
  }

  private stringify(yek: Yek): string {
    switch (yek.yek.kind) {
      case 'all-labels':
        return 'knn/all-labels'
      case 'label->class':
        return 'knn/label->class:' + yek.yek.key
      case 'cache-signature':
        return 'knn/cache-signature'
    }
  }
}

async function dropCacheOnSignatureMismatch(
  store: YekLavStore,
  expected: { signature: string; internalVersion: number }
): Promise<void> {
  const signatureYek: CacheSignatureYek = {
    yek: { kind: 'cache-signature', key: undefined },
  }
  const signatureLav: CacheSignatureLav | undefined = await store.get(
    signatureYek
  )

  const value = signatureLav?.lav.value
  if (lodash.isEqual(value, expected)) {
    return
  }

  log.debug(
    `KNN classifier cache signature mismatch: ` +
      `got ${JSON.stringify(value)}, expected ${JSON.stringify(
        expected
      )}. Cache will be dropped.`
  )

  const toRemove: Yek[] = [
    { yek: { kind: 'all-labels', key: undefined } },
    { yek: { kind: 'cache-signature', key: undefined } },
  ]
  const yek: AllLabelsYek = { yek: { kind: 'all-labels', key: undefined } }
  const lav: AllLabelsLav | undefined = await store.get(yek)

  for (const { label } of lav?.lav.value ?? []) {
    toRemove.push({ yek: { kind: 'label->class', key: label } })
  }
  await store.remove(toRemove)

  await store.set([
    {
      yek: { yek: { kind: 'cache-signature', key: undefined } },
      lav: {
        lav: {
          kind: 'cache-signature',
          value: expected,
        },
      },
    },
  ])
}

/**
 * NOTE: @see KNNClassifier is a class with private fields,
 * so it can be `extend`ed, but not `implement`ed. @see InterfaceOf enables
 * to use either & allows to selectively promise-ifying some methods (
 * KNNClassifier is fully syncronous, but cache storage is not).
 */
type KnnClassifierInterface = Omit<
  InterfaceOf<KNNClassifier>,
  'addExample' | 'clearClass' | 'predictClass'
> & {
  addExample: (
    // This parameter's type is set manually rather than inferred,
    // see 'conflicting-tensor2d-versions' note for more details
    example: tf.Tensor,
    label: number | string
  ) => Promise<void>
  predictClass: (
    // This parameter's type is set manually rather than inferred,
    // see 'conflicting-tensor2d-versions' note for more details
    input: tf.Tensor,
    k?: number
  ) => ReturnType<KNNClassifier['predictClass']>
  clearClass: (
    ...args: Parameters<KNNClassifier['clearClass']>
  ) => Promise<void>
}

type KnnTensor = Parameters<KNNClassifier['addExample']>[0]

/**
 * @summary A wrapper around @see KNNClassifier that caches all the data in the
 * browser's local storage. Its API mimics @see KNNClassifier API as much as possible.
 *
 * @description See https://github.com/tensorflow/tfjs/issues/633#issuecomment-576218643
 * about how to properly serialize/deserialize @see KNNClassifier
 */
export class CachedKnnClassifier implements KnnClassifierInterface {
  private impl: KNNClassifier
  private store: YekLavStore
  private static readonly INTERNAL_VERSION: number = 1

  /**
   * @param expectedCacheSignature A string which identifies the "version"
   * of the expected cached data. If the expected and actual signatures don't
   * match then the cache will be dropped.
   */
  static async create(
    storage: browser.Storage.StorageArea,
    expectedCacheSignature: string
  ): Promise<CachedKnnClassifier> {
    const store = new YekLavStore(storage)
    await dropCacheOnSignatureMismatch(store, {
      signature: expectedCacheSignature,
      internalVersion: this.INTERNAL_VERSION,
    })

    const yek: AllLabelsYek = { yek: { kind: 'all-labels', key: undefined } }
    const lav: AllLabelsLav | undefined = await store.get(yek)
    if (lav == null) {
      return new CachedKnnClassifier(new KNNClassifier(), storage)
    }
    const yeks: LabelToClassYek[] = lav.lav.value.map(({ label }) => {
      return { yek: { kind: 'label->class', key: label } }
    })

    const classes: Parameters<KNNClassifier['setClassifierDataset']>[0] = {}
    for (const { yek, lav } of await store.get(yeks)) {
      const { data, shape } = lav.lav.value
      // @ts-ignore, see 'conflicting-tensor2d-versions' note
      classes[yek.yek.key] = tf.tensor(data, shape)
    }

    const impl = new KNNClassifier()
    impl.setClassifierDataset(classes)
    return new CachedKnnClassifier(impl, storage)
  }

  private constructor(impl: KNNClassifier, store: browser.Storage.StorageArea) {
    this.impl = impl
    this.store = new YekLavStore(store)
  }

  async addExample(example: tf.Tensor, label: number | string): Promise<void> {
    // @ts-ignore, see 'conflicting-tensor2d-versions' note
    this.impl.addExample(example, label)
    // NOTE: both the input parameter & `class_` below are tensors, but it's
    // important to NOT cache the input. The input goes through a transformation
    // inside KNNClassifier.addExample() and *that* can be safely cached.
    // For reference, these transformations can be found here:
    // https://github.com/tensorflow/tfjs-models/blob/646992fd7ab8237c0dc908f2526301414b417c95/knn-classifier/src/index.ts#L44-L87
    const class_: KnnTensor = this.impl.getClassifierDataset()[label]

    let records: YekLav[] = [
      await this.store.prepareAppend(
        { yek: { kind: 'all-labels', key: undefined } },
        { lav: { kind: 'all-labels', value: [{ label }] } }
      ),
      {
        yek: { yek: { kind: 'label->class', key: label } },
        lav: {
          lav: {
            kind: 'label->class',
            value: { data: Array.from(class_.dataSync()), shape: class_.shape },
          },
        },
      },
    ]
    await this.store.set(records)
  }
  predictClass(input: tf.Tensor, k?: number) {
    // @ts-ignore, see 'conflicting-tensor2d-versions' note
    return this.impl.predictClass(input, k)
  }
  async clearClass(label: number | string): Promise<void> {
    this.impl.clearClass(label)
    const toRemove: Yek[] = [{ yek: { kind: 'label->class', key: label } }]
    const toSet: YekLav[] = [
      await this.store.prepareRemoval(
        { yek: { kind: 'all-labels', key: undefined } },
        [label]
      ),
    ]
    await this.store.remove(toRemove)
    await this.store.set(toSet)
  }
  clearAllClasses(): never {
    throw new Error(`CachedKnnClassifier.clearAllClasses() has not been implemented ' +
    'because it's not expected to be needed`)
  }
  getClassExampleCount() {
    return this.impl.getClassExampleCount()
  }
  getClassifierDataset() {
    return this.impl.getClassifierDataset()
  }
  getNumClasses() {
    return this.impl.getNumClasses()
  }
  setClassifierDataset(_: { [label: string]: KnnTensor }): never {
    throw new Error(`CachedKnnClassifier.setClassifierDataset() has not been implemented ' +
    'because it's not expected to be needed`)
  }
  dispose() {
    return this.impl.dispose()
  }
}
