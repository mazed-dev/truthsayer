export const unixtime = {
  now: (): number => {
    return Math.floor(new Date().getTime() / 1000)
  },
  nowMs: (): number => {
    return Math.floor(new Date().getTime())
  },
  from: (date: Date): number => {
    return Math.floor(date.getTime())
  },
  toDate: (unixtime: number): Date => {
    return new Date(unixtime)
  },
}
