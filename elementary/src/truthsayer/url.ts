/**
 * Set of helper functions to generate direct URLs in truthsayer web app
 */

export namespace truthsayer.url {
  function getTruthsayerUrl(): URL {
    return new URL(process.env.REACT_APP_TRUTHSAYER_URL || window.location.href)
  }
  export const make = ({
    pathname,
    query,
  }: {
    pathname?: string
    query?: Record<string, string>
  }): URL => {
    const url = getTruthsayerUrl()
    if (pathname != null) {
      url.pathname = pathname
    }
    if (query != null) {
      for (const key in query) {
        url.searchParams.append(key, query[key])
      }
    }
    return url
  }

  export const makeNode = (nid: string): URL => {
    return make({ pathname: `/n/${nid}` })
  }

  export const makeSearch = (text: string): URL => {
    return make({ pathname: '/search', query: { q: text } })
  }

  export const belongs = (url: string): boolean => {
    const forewordUrl = getTruthsayerUrl()
    const urlObj = new URL(url)
    return forewordUrl.host === urlObj.host
  }
}
