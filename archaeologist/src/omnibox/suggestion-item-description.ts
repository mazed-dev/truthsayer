import lodash from 'lodash'

export function formatDescription(title: string, url?: string): string {
  if (process.env.CHROMIUM) {
    // We must escape 5 predefined characters of XML to display them in Chromium
    // https://developer.chrome.com/docs/extensions/reference/omnibox/#type-SuggestResult
    title = lodash.escape(title)
    if (url != null) {
      url = ` <dim>—</dim> <url>${lodash.escape(url)}</url>`
    } else {
      // Some XML must be added to avoid runtime validation errors
      url = '<dim></dim>'
    }
  } else {
    // Firefox doesn't support any markup in description and it always shows
    // content as a part of description, so no need for us to add URL to a
    // description here, so we just skipping it.
    url = ''
  }
  return `${title}${url}`
}
