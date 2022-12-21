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
  // FIXME(akindyakov): This is a dirty hack to limit time of search by limiting
  // number of nodes we are looking at overall.
  for (let i = 0; i < 2000; ++i) {
    const node = await iter.next()
    if (node != null && beagle.searchNode(node)) {
      suggested.push(node)
      if (suggested.length >= limit) {
        break
      }
    }
  }
  return suggested
}
