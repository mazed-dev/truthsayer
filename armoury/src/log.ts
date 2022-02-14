export const log = {
  debug(...args: any): void {
    console.log('Debug', ...args) // eslint-disable-line no-console
  },

  exception(err: Error, ...args: any): void {
    console.error(err, ...args) // eslint-disable-line no-console
  },
}
