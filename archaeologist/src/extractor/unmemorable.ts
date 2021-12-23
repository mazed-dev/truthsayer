const kUnmemorable: RegExp[] = [
  /https?:\/\/(www\.)?google\.com/,
  /https?:\/\/(www\.)?facebook\.com/,
  /https:\/\/mazed.dev/,
  /localhost:3000/,
]

export function isMemorable(url: string): boolean {
  return !kUnmemorable.find((r: RegExp) => {
    return url.match(r)
  })
}
