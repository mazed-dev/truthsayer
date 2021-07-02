export function jcss(...cs: string[]): string {
  return [...cs].filter((c) => !!c).join(' ')
}
