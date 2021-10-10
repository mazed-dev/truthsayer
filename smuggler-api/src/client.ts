import axios, { CancelToken, CancelTokenSource } from 'axios'

export type { CancelToken }

export function makeCancelToken(): CancelTokenSource {
  return axios.CancelToken.source()
}

function _getSmuglerApibaseURL() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '/smuggler'
    case 'development':
      return undefined
    case 'test':
      return undefined
    default:
      return undefined
  }
}

const _client = axios.create({
  baseURL: _getSmuglerApibaseURL(),
  timeout: 8000,
})
