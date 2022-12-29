/**
 * Local encryption is not ready to use yet, in fact it is not
 * part of our MVP, mock it for now.
 */
export type LocalCrypto = {}

export interface AccountInterface {
  isAuthenticated: () => boolean
  getUid: () => string
  getName: () => string
  getEmail: () => string
  getLocalCrypto: () => LocalCrypto
}
