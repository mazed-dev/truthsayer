import { isBrowserUrl } from './browser'

const kUnmemorable: RegExp[] = [
  /https?:\/\/(www\.)?google\.com/,
  // Block bookmarking for google keep entirely.
  // Because google.keep uses URL hash based routing, so individual notes are
  // not distinguishable for archaeologist - they all have the same origin ID.
  /https?:\/\/(www\.)?keep\.google\.com/,
  /https?:\/\/(www\.)?fb\.com/,
  /https?:\/\/(www\.)?facebook\.com/,
  /https?:\/\/(www\.)?instagram\.com/,
  /https:\/\/mazed.dev/,
  /localhost:3000/,
]

export function isMemorable(url: string): boolean {
  if (isBrowserUrl(url)) {
    return false
  }
  return !kUnmemorable.find((r: RegExp) => {
    return url.match(r)
  })
}
