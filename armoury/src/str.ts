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

export function ensureSentenceEndPunctuation(
  sentense: string,
  toAdd: string
): string {
  if (!sentense.match(/[!?.…]$/)) {
    return sentense + toAdd
  }
  return sentense
}

export function sortOutSpacesAroundPunctuation(str: string): string {
  return str
    .replace(/\s*"\s*(.*?)\s*"/g, ' "$1" ') // ' abc ' -> 'abc'
    .replace(/\s*'\s*(.*?)\s*'/g, " '$1' ") // " abc " -> "abc"
    .replace(/\s*([«“„〝({\[])\s*(.*?)\s*([»”‟〞)\]}])/g, ' $1$2$3 ')
    .replace(/\s+([:;!?.,…'ʼ’]+)\s+/g, '$1 ') // "abc ?! Abc" -> "abc?! Abc"
    .replace(/\s+([:;!?.,…'ʼ’]+)$/g, '$1') // "A abc ." -> "A abc."
    .replace(/\s*(['ʼ’])\s*(ll|s|m|d|re)/g, '$1$2')
    .replace(/\s\s+/g, ' ')
    .trim()
}

export function truncatePretty(str: string, limit: number) {
  if (limit < 1) {
    return str
  }
  return str.length > limit ? `${str.slice(0, limit - 1)}…` : str
}
