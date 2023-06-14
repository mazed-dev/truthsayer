import { get as lsGet, set as lsSet } from 'local-storage'

type LocalStorageKeys =
  | 'mazed.account-config.local.cookie-consent'
  | 'mazed.account-config.local.onboarding-status'

function makeGetter<Type>(key: LocalStorageKeys, default_: Type): () => Type {
  return () => {
    const value: Type | null | undefined = lsGet<Type>(key)
    return value ?? default_
  }
}

function makeSetter<Type>(key: LocalStorageKeys): (value: Type) => boolean {
  return (value: Type) => {
    return lsSet(key, value)
  }
}

export namespace accountConfig {
  export function cleanup() {}
  export namespace shared {
    // Shared user config across all devices
  }
  export namespace local {
    // Local device config, never synced between any 2 devices or saved to backend
    export namespace cookieConsent {
      // Persist user cookie conscent between sessions on the same device
      const key: LocalStorageKeys = 'mazed.account-config.local.cookie-consent'
      export type CookieConsent = {
        acked: boolean
      }
      export const get = makeGetter<CookieConsent>(key, { acked: false })
      export const set = makeSetter<CookieConsent>(key)
    }
    export namespace onboarding {
      const key: LocalStorageKeys =
        'mazed.account-config.local.onboarding-status'
      export type OnboardingStatus = {
        invoked: boolean
      }
      export const get = makeGetter<OnboardingStatus>(key, { invoked: false })
      export const set = makeSetter<OnboardingStatus>(key)
    }
  }
}
