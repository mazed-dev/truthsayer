export function range(
  start: number,
  end?: number,
  step?: number
): Array<number> {
  if (!end) {
    end = start
    start = 0
  }
  const n: number = end - start
  step = step || 1
  return new Array(n).fill(undefined).map((_, i) => i * step + start)
}
