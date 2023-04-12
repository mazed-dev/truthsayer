/**
 * https://www.regular-expressions.info/unicode.html#category
 */
export function isSmartCase(s: string): boolean {
  return !(s.search(/\p{Lu}/u) < 0)
}

export function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function splitStringByWord(
  str: string,
  splitPos: number
): [string, string] {
  if (splitPos < 0) {
    splitPos = str.length + splitPos
  }
  const before = str.lastIndexOf(' ', splitPos)
  let after = str.indexOf(' ', splitPos + 1)
  if (after < 0) {
    after = str.length
  }
  if (after - splitPos < splitPos - before) {
    splitPos = after
  } else {
    splitPos = before
  }
  return [
    str.slice(0, splitPos < 0 ? splitPos - 1 : splitPos),
    str.slice(splitPos < 0 ? splitPos : splitPos + 1),
  ]
}

export function padNonEmptyStringWithSpaceHead(str: string): string {
  return (!str || str.startsWith(' ') ? '' : ' ') + str
}
export function padNonEmptyStringWithSpaceTail(str: string): string {
  return str + (!str || str.endsWith(' ') ? '' : ' ')
}
