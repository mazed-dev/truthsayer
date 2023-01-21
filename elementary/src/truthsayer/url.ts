/**
 * Set of helper functions to generate direct URLs in truthsayer web app
 */
export namespace truthsayer.url {
  export const make = ({
    pathname,
    query,
  }: {
    pathname?: string
    query?: Record<string, string>
  }): URL => {
    const url = new URL(
      process.env.REACT_APP_SMUGGLER_API_URL || window.location.href
    )
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

  export const isMazed = (url: string): boolean => {
    const mazedUrl = new URL(process.env.REACT_APP_SMUGGLER_API_URL || '')
    const urlObj = new URL(url)
    return mazedUrl.host === urlObj.host
  }
}
