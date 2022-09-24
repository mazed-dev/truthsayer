export type ContentAppOperationMode =
  /**
   * Mode in which content app is only allowed to act as a passive responder
   * to requests received from other parts of the system
   * (@see FromContent.Request are disallowed).
   */
  | 'passive-mode-content-app'
  /**
   * Mode in which content app is allowed to perform actions on its own,
   * without an explicit request from a different part of the system
   * (@see FromContent.Request are allowed).
   */
  | 'active-mode-content-app'
