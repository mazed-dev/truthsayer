/**
 * Generate unique path to a given html element in DOM to use with
 * `document.querySelector` to access element later
 */
export function genElementDomPath(el: Element): string[] {
  const stack = []
  while (el.parentNode != null) {
    let sibCountOfType = 0
    let sibTypeInd = 0
    for (let key = 0; key < el.parentNode.childNodes.length; ++key) {
      const sibling = el.parentNode.childNodes[key]
      if (sibling.nodeName === el.nodeName) {
        ++sibCountOfType
        if (sibling === el) {
          // Children in selector is 1-indexed
          sibTypeInd = sibCountOfType
        }
      }
    }
    const nodeName = el.nodeName.toLowerCase()
    const { id } = el
    if (id) {
      stack.push(`${nodeName}#${id}`)
    } else if (sibCountOfType > 1) {
      // https://drafts.csswg.org/selectors/#the-nth-child-pseudo
      stack.push(`${nodeName}:nth-of-type(${sibTypeInd})`)
    } else {
      stack.push(nodeName)
    }
    el = el.parentNode as Element
  }
  return stack.reverse()
}
