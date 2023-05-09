import { log } from './log'

export namespace unixtime {
  export type Type = number

  export function nowMs(): Type {
    return Math.floor(new Date().getTime())
  }
  export function fromMilliseconds(unixtimeInMilliseconds: number): Type {
    return Math.floor(unixtimeInMilliseconds / 1000)
  }
  export function fromDate(date: Date): Type {
    return fromMilliseconds(date.getTime())
  }
  export function toDate(unixtime: Type): Date {
    return new Date(unixtime * 1000)
  }
  export function now(): Type {
    return fromDate(new Date())
  }
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class Timer {
  start: number
  eventName?: string

  constructor(eventName?: string) {
    this.eventName = eventName
    if (this.eventName) {
      log.debug(`Timer ${this.eventName} started`)
    }
    this.start = new Date().getTime()
  }

  elapsed(): number {
    const duration = new Date().getTime() - this.start
    if (this.eventName) {
      log.debug(`Timer ${this.eventName} elapsed ${duration / 1000}s`)
    }
    return duration
  }
}
