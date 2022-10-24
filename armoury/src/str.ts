/**
 * https://www.regular-expressions.info/unicode.html#category
 */
export function isSmartCase(s: string): boolean {
  return !(s.search(/\p{Lu}/u) < 0)
}

export function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
