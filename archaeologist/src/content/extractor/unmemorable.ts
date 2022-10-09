const kUnmemorable: RegExp[] = [
  /https?:\/\/(www\.)?google\.com/,
  // Block bookmarking for google keep entirely.
  // Because google.keep uses URL hash based routing, so individual notes are
  // not distinguishable for archaeologist - they all have the same origin ID.
  /https?:\/\/(www\.)?keep\.google\.com/,
  // Google Meet is for video-only, live content so there is nothing to index
  /https?:\/\/(www\.)?meet\.google\.com/,
  /https?:\/\/(www\.)?.*web\.zoom\.us/,
  /https?:\/\/(www\.)?fb\.com/,
  /https?:\/\/(www\.)?facebook\.com/,
  /https?:\/\/(www\.)?instagram\.com/,
  /https:\/\/mazed\.\w+/,
  /localhost:3000/,
  // Block internal "service" pages for all browsers (used
  // for things like extension management, settings etc):
  //// Firefox:
  /^about:.*/,
  /https?:\/\/about:.*/,
  /^moz-extension:.*/,
  //// Chrome:
  /^extension:.*/,
  /^chrome:.*/,
  /https?:\/\/chrome:.*/,
  //// Edge:
  /^edge:.*/,
  /https?:\/\/edge:.*/,
]

export function isMemorable(url: string): boolean {
  return !kUnmemorable.find((r: RegExp) => {
    return url.match(r)
  })
}
