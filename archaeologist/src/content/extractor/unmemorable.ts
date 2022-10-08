const kUnmemorable: RegExp[] = [
  /https?:\/\/(www\.)?google\.com/,
  // Block bookmarking for google keep entirely.
  // Because google.keep uses URL hash based routing, so individual notes are
  // not distinguishable for archaeologist - they all have the same origin ID.
  /https?:\/\/(www\.)?keep\.google\.com/,
  /https?:\/\/(www\.)?fb\.com/,
  /https?:\/\/(www\.)?facebook\.com/,
  /https?:\/\/(www\.)?instagram\.com/,
  /https:\/\/mazed\.\w+/,
  /localhost:3000/,
  // Block internal "service" pages for all browsers (used
  // for things like extension management, settings etc)
  /^about:.*/,
  /^chrome:.*/,
  /^edge:.*/,
  /https?:\/\/about:.*/,
  /https?:\/\/chrome:.*/,
  /https?:\/\/edge:.*/,
]

export function isMemorable(url: string): boolean {
  return !kUnmemorable.find((r: RegExp) => {
    return url.match(r)
  })
}
