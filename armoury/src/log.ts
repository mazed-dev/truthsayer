export const log = {
  debug(...args: any): void {
    console.log('[Mazed/debug]', ...args) // eslint-disable-line no-console
  },
  info(...args: any): void {
    console.info('[Mazed/info]', ...args) // eslint-disable-line no-console
  },
  warning(...args: any): void {
    console.warn('[Mazed/warning]', ...args) // eslint-disable-line no-console
  },
  error(...args: any): void {
    console.error('[Mazed/error]', ...args) // eslint-disable-line no-console
  },

  /**
   * Funcional style logging
   * to inject logging in functions call chain:
   *  Before:
   *    teleportBar(fooToBar(createFoo()))
   *  After:
   *    teleportBar(log.fdebug(fooToBar(log.fdebug(createFoo()))))
   */
  fdebug<T>(v: T, ...args: any): T {
    console.log('[Mazed/debug]', v, ...args) // eslint-disable-line no-console
    return v
  },

  exception(err: Error, ...args: any): void {
    console.error('[Mazed/exception]', err, ...args) // eslint-disable-line no-console
  },
}
