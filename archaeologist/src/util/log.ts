// This is a full copy of truthsayer/src/util/log.ts
// TODO: separate util into a separate repo and package

export function debug(...args: any): void {
  console.log('Debug', ...args) // eslint-disable-line no-console
}
