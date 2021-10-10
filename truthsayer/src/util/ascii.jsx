export function isAscii(str: string): boolean {
  return /^[\x21-\x7E]*$/.test(str)
}
