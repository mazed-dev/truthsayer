export const unixtime = {
  now: (): number => {
    return Math.floor(new Date().getTime() / 1000)
  },
  nowMs: (): number => {
    return Math.floor(new Date().getTime())
  },
}
