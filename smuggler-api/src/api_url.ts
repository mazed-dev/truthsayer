import lodash from 'lodash'
import { stringify } from 'query-string'

export function makeUrl(path?: string, query?: Record<string, any>): string {
  const q = query ? `?${stringify(query)}` : ''
  const p = lodash.trim(path || '', '/')
  const base = lodash.trimEnd(process.env.REACT_APP_SMUGGLER_API_URL || '', '/')
  return `${base}/${p}${q}`
}
