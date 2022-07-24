import { TNode } from 'smuggler-api'

export function calculateBadgeCounter(quotes: TNode[], bookmark?: TNode) {
  const n = quotes.length + (bookmark != null ? 1 : 0)
  return n !== 0 ? n.toString() : undefined
}
