import { get as lsGet, set as lsSet } from 'local-storage'

type LocalStorageKeys = 'account-config.local.cookie-consent'

export namespace accountConfig {
  export namespace local {
    // Local device config, never synced between any 2 devices or saved to backend

    export namespace cookieConsent {
      // Persist user cookie conscent between sessions on the same device
      const key: LocalStorageKeys = 'account-config.local.cookie-consent'
      export type CookieConsent = {
        acked: boolean
      }
      export function get(): CookieConsent {
        const value: CookieConsent | null | undefined =
          lsGet<CookieConsent>(key)
        return value ?? { acked: false }
      }
      export function set(value: CookieConsent): boolean {
        return lsSet(key, value)
      }
    }
  }
}
