import { smuggler, TNode } from 'smuggler-api'
import { Beagle } from 'elementary'

export async function suggestAssociations(
  phrase: string,
  limit?: number
): Promise<TNode[]> {
  const beagle = Beagle.fromString(phrase)
  const iter = smuggler.node.slice({})
  const suggested: TNode[] = []
  limit = limit ?? 8
  for (let i = 0; i < 8; ++i) {
    const node = await iter.next()
    if (node != null && beagle.searchNode(node)) {
      suggested.push(node)
    }
  }
  return suggested
}
