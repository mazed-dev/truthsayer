export namespace unixtime {
  export type Type = number

  export function now(): Type {
    return Math.floor(new Date().getTime() / 1000)
  }
  export function nowMs(): Type {
    return Math.floor(new Date().getTime())
  }
  export function from(date: Date): Type {
    return Math.floor(date.getTime())
  }
  export function toDate(unixtime: Type): Date {
    return new Date(unixtime)
  }
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
