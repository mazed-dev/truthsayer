import lodash from 'lodash'
import { tf } from 'text-information-retrieval'
import browser from 'webextension-polyfill'

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
type LabelToClassLav = GenericLav<'label->class', { class: tf.Tensor2D }>

type Yek = AllLabelsYek | LabelToClassYek

type Lav = AllLabelsLav | LabelToClassLav

type YekLav = { yek: Yek; lav: Lav }

function isOfArrayKind(lav: Lav): lav is AllLabelsLav {
  return Array.isArray(lav.lav.value)
}

/** A copy-paste of @see storage_api_browser_ext.YekLavStore */
class YekLavStore {
  private store: browser.Storage.StorageArea

  constructor(store: browser.Storage.StorageArea) {
    this.store = store
  }

  /** @see storage_api_browser_ext.YekLavStore.set */
  set(items: YekLav[]): Promise<void> {
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
    return this.store.set(records)
  }

  get(yek: AllLabelsYek): Promise<AllLabelsLav | undefined>
  get(yek: LabelToClassYek): Promise<LabelToClassLav | undefined>
  get(
    yek: LabelToClassYek[]
  ): Promise<{ yek: LabelToClassYek; lav: LabelToClassLav }[]>
  get(yek: Yek): Promise<Lav | undefined>
  get(yek: Yek | Yek[]): Promise<Lav | YekLav[] | undefined> {
    if (Array.isArray(yek)) {
      const keyToYek = new Map<string, Yek>()
      yek.forEach((singleYek: Yek) =>
        keyToYek.set(this.stringify(singleYek), singleYek)
      )
      const keys: string[] = Array.from(keyToYek.keys())
      const records: Promise<Record<string, any>> = this.store.get(keys)
      return records.then((records: Record<string, any>): Promise<YekLav[]> => {
        const yeklavs: YekLav[] = []
        for (const [key, yek] of keyToYek) {
          const lav = key in records ? (records[key] as Lav) : undefined
          if (lav == null) {
            continue
          }
          yeklavs.push({ yek, lav })
        }
        return Promise.resolve(yeklavs)
      })
    }

    const key = this.stringify(yek)
    const records: Promise<Record<string, any>> = this.store.get(key)
    return records.then(
      (records: Record<string, any>): Promise<Lav | undefined> => {
        const record = records[key]
        if (record == null) {
          return Promise.resolve(undefined)
        }
        return Promise.resolve(record as Lav)
      }
    )
  }

  // TODO[snikitin@outlook.com] Explain that this method is a poor man's attempt
  // to increase atomicity of data insertion
  async prepareAppend(
    yek: AllLabelsYek,
    lav: AllLabelsLav
  ): Promise<{
    yek: AllLabelsYek
    lav: AllLabelsLav
  }>
  async prepareAppend(
    yek: LabelToClassYek,
    lav: LabelToClassLav
  ): Promise<{
    yek: LabelToClassYek
    lav: LabelToClassLav
  }>
  async prepareAppend(yek: Yek, appended_lav: Lav): Promise<YekLav> {
    if (yek.yek.kind !== appended_lav.lav.kind) {
      throw new Error(
        `Attempted to append a key/value pair of mismatching kinds: '${yek.yek.kind}' !== '${appended_lav.lav.kind}'`
      )
    }
    const lav = await this.get(yek)
    if (lav != null && !isOfArrayKind(lav)) {
      throw new Error(`prepareAppend only works/makes sense for arrays`)
    }
    const value = lav?.lav.value ?? []
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
          value: value.concat(appended_lav.lav.value),
        },
      },
    }
  }

  async remove(yeks: Yek[]): Promise<void> {
    return this.store.remove(yeks.map(this.stringify))
  }

  async prepareRemoval(
    yek: AllLabelsYek,
    criteria: Label[]
  ): Promise<{
    yek: AllLabelsYek
    lav: AllLabelsLav
  }>
  /**
   *
   * @param yek A yek that points to a lav from which the data should be removed
   * @param criteria Criteria (similar to a predicate) of which values should
   * be removed from a lav assosiated with the input yek
   */
  async prepareRemoval(yek: Yek, criteria: Label[]): Promise<YekLav> {
    const lav = await this.get(yek)
    if (lav != null && !isOfArrayKind(lav)) {
      throw new Error(`prepareRemoval only works/makes sense for arrays`)
    }
    const isArrayOfObjectsWithLabelField = (
      kind: typeof yek.yek.kind,
      _criteria: object[]
    ): _criteria is { label: Label }[] => {
      return kind === 'all-labels'
    }

    const value = lav?.lav.value ?? []
    switch (yek.yek.kind) {
      case 'all-labels': {
        if (!isArrayOfObjectsWithLabelField(yek.yek.kind, value)) {
          throw new Error(
            'Fallen into prepareRemoval case which works only for arrays of ' +
              `Labels while processing a non-Label '${yek.yek.kind}' kind`
          )
        }
        lodash.remove(
          value,
          ({ label }: { label: Label }) => criteria.indexOf(label) !== -1
        )
        break
      }
    }
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
    }
  }
}

/**
 * @summary Given a `class` type T, combine all names (or "keys") of methods into a
 * TypeScript 'union'. Discard all data fields.
 */
type KeysOfMethods<T> = {
  // Iterate over each property.
  [K in keyof T]: T[K] extends (...args: any[]) => any // If the property is a function...
    ? K // Function, not data - set the value of this property to its own key.
    : never // Data is not allowed, use never to exclude it.

  // Get the union of all method keys (which are now the keys that have not been set to `never`)
}[keyof T]

/**
 * @summary Given a `class` type T, make a new type that is a public interface of T.
 * @description Implementation is mostly taken from https://stackoverflow.com/a/61376012/3375765
 */
type InterfaceOf<T> = Pick<T, KeysOfMethods<T>>

/**
 * NOTE: @see KNNClassifier is a class with private fields,
 * so it can be `extend`ed, but not `implement`ed. @see InterfaceOf enables
 * to use either & allows to selectively promise-ifying some methods (
 * KNNClassifier is fully syncronous, but cache storage is not).
 */
type KnnClassifierInterface = Omit<
  InterfaceOf<tf.KNNClassifier>,
  'addExample' | 'clearClass'
> & {
  addExample: (
    ...args: Parameters<tf.KNNClassifier['addExample']>
  ) => Promise<void>
  clearClass: (
    ...args: Parameters<tf.KNNClassifier['clearClass']>
  ) => Promise<void>
}

export class CachedKnnClassifier implements KnnClassifierInterface {
  private impl: tf.KNNClassifier
  private store: YekLavStore

  static async create(
    storage: browser.Storage.StorageArea
  ): Promise<CachedKnnClassifier> {
    // TODO[snikitin@outlook] add link to the issue where serialisation/deserialisation
    // is explained
    const store = new YekLavStore(storage)

    const yek: AllLabelsYek = { yek: { kind: 'all-labels', key: undefined } }
    const lav: AllLabelsLav | undefined = await store.get(yek)
    if (lav == null) {
      return new CachedKnnClassifier(new tf.KNNClassifier(), storage)
    }
    const yeks: LabelToClassYek[] = lav.lav.value.map(({ label }) => {
      return { yek: { kind: 'label->class', key: label } }
    })
    const classes: Parameters<tf.KNNClassifier['setClassifierDataset']>[0] = {}
    for (const { yek, lav } of await store.get(yeks)) {
      classes[yek.yek.key] = lav.lav.value.class
    }

    const impl = new tf.KNNClassifier()
    impl.setClassifierDataset(classes)
    return new CachedKnnClassifier(impl, storage)
  }

  private constructor(
    impl: tf.KNNClassifier,
    store: browser.Storage.StorageArea
  ) {
    this.impl = impl
    this.store = new YekLavStore(store)
  }

  async addExample(example: tf.Tensor, label: number | string): Promise<void> {
    this.impl.addExample(example, label)
    // TODO[snikitin@outlook.com] Document why this transformation has to take
    // place, and highlight why it needs to be *before* storage manipulation.
    // Refer to https://github.com/tensorflow/tfjs-models/blob/646992fd7ab8237c0dc908f2526301414b417c95/knn-classifier/src/index.ts
    const class_ = this.impl.getClassifierDataset()[label]

    let records: YekLav[] = [
      await this.store.prepareAppend(
        { yek: { kind: 'all-labels', key: undefined } },
        { lav: { kind: 'all-labels', value: [{ label }] } }
      ),
      {
        yek: { yek: { kind: 'label->class', key: label } },
        lav: {
          lav: { kind: 'label->class', value: { class: class_ } },
        },
      },
    ]
    await this.store.set(records)
  }
  predictClass(input: tf.Tensor, k?: number) {
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
  setClassifierDataset(_: { [label: string]: tf.Tensor2D }): never {
    throw new Error(`CachedKnnClassifier.setClassifierDataset() has not been implemented ' +
    'because it's not expected to be needed`)
  }
  dispose() {
    return this.impl.dispose()
  }
}
