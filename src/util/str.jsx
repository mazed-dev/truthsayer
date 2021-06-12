/**
 * https://www.regular-expressions.info/unicode.html#category
 */
export function isSmartCase(s: string): boolean {
  return !(s.search(/\p{Lu}/u) < 0)
}
