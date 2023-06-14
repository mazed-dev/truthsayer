export const log = {
  debug(...args: any): void {
    console.log('[fw/debug]', ...args) // eslint-disable-line no-console
  },
  info(...args: any): void {
    console.info('[fw/info]', ...args) // eslint-disable-line no-console
  },
  warning(...args: any): void {
    console.warn('[fw/warning]', ...args) // eslint-disable-line no-console
  },
  error(...args: any): void {
    console.error('[fw/error]', ...args) // eslint-disable-line no-console
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
    console.log('[fw/debug]', v, ...args) // eslint-disable-line no-console
    return v
  },

  exception(err: Error, ...args: any): void {
    console.error('[fw/exception]', err, ...args) // eslint-disable-line no-console
  },
}
