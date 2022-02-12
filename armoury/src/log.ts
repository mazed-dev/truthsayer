export function debug(...args: any): void {
  console.log('Debug', ...args) // eslint-disable-line no-console
}

export function exception(err: Error, ...args: any): void {
  console.error(err, ...args) // eslint-disable-line no-console
}
