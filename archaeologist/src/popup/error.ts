export function makeUserFacingError({
  failedTo,
  tryTo,
}: {
  failedTo: string
  tryTo: string
}) {
  return `We failed to ${failedTo} 😞 It's not you, it's us! Try to ${tryTo}, or let us know!`
}
