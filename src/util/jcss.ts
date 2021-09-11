export function jcss(...cs: (string | undefined)[]): string {
  return [...cs].filter((c) => !!c).join(' ')
}
