const kBrowserUrls: RegExp[] = [/^chrome:\/\//, /^about:/, /^edge:\/\//]
export function isBrowserUrl(url: string): boolean {
  if (
    kBrowserUrls.find((r: RegExp) => {
      return url.match(r)
    })
  ) {
    return true
  }
  return false
}
