export type UserFacingError = {
  failedTo: string /** What user-initiated action has failed */
  tryTo: string /** What a user can try to do to resolve the error */
}

/** Turn a UserFacingError into a string that can be shown to the user. */
export function renderUserFacingError({ failedTo, tryTo }: UserFacingError) {
  return `We failed to ${failedTo} 😞 It's not you, it's us! Try to ${tryTo}, or let us know!`
}
