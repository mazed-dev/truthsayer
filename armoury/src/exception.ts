/**
 * See https://stackoverflow.com/a/30469297/3375765 for more information
 * about the implementation
 */
function isError(value: any): value is Error {
  return value && value.name && value.message
}

/**
 * Detect the 'AbortError' exception type to ignore such exceptions comletely
 * in exception handling code. Those are very normal and happens on canceled
 * operations, therefore they are not real exception, but rather cancelation
 * signal of asyncronous code.
 */
export function isAbortError(exception: Error): boolean {
  return exception.name === 'AbortError'
}

export function errorise(value: any): Error {
  if (isError(value)) {
    return value
  }
  return { name: 'unknown exception', message: JSON.stringify(value) }
}
