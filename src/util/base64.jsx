export function toBase64(s: string): string {
  return btoa(s);
}

export function fromBase64(a: string): string {
  return atob(a);
}
