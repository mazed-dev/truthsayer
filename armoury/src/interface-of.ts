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
export type InterfaceOf<T> = Pick<T, KeysOfMethods<T>>
