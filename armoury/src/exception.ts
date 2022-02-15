/**
 * Detect the 'AbortError' exception type to ignore such exceptions comletely
 * in exception handling code. Those are very normal and happens on canceled
 * operations, therefore they are not real exception, but rather cancelation
 * signal of asyncronous code.
 */
export function isAbortError(exception: Error): boolean {
  return exception.name === 'AbortError'
}
