const makeUrl = ({ pathname }: { pathname?: string }): URL => {
  let url = new URL(process.env.REACT_APP_SMUGGLER_API_URL || '')
  if (pathname != null) {
    url.pathname = pathname
  }
  return url
}

const makeNodeUrl = (nid: string): URL => {
  return makeUrl({ pathname: `/n/${nid}` })
}

export const mazed = {
  makeUrl,
  makeNodeUrl,
}
