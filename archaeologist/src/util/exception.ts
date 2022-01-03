export function isAbortError(exception: Error): boolean {
  return exception.name === 'AbortError'
}
