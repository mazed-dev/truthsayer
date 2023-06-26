import { InterfaceOf } from 'armoury'
import { KNNClassifier, tf } from 'text-information-retrieval'

/**
 * NOTE: @see KNNClassifier is a class with private fields,
 * so it can be `extend`ed, but not `implement`ed. @see InterfaceOf enables
 * to use either & allows to selectively promise-ifying some methods if needed (
 * KNNClassifier is fully syncronous, but, for example, if it's required to write
 * an implementation that under the hood uses something async, like
 * @see browser.storage.local etc).
 */
export type AsyncKnnClassifier = Omit<
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
