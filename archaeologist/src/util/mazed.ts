import lodash from 'lodash'

const makeUrl = (params: { pathname?: string }): URL => {
  let url = new URL(process.env.REACT_APP_SMUGGLER_API_URL || '')
  lodash.extend(url, params)
  return url
}

const makeNodeUrl = (nid: string): URL => {
  return makeUrl({ pathname: `/n/${nid}` })
}

export const mazed = {
  makeUrl,
  makeNodeUrl,
}
