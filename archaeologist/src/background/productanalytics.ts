/**
 * Wrapper around @see armoury.productanalytics that syncs
 * Product Analytics instance with user's authentication state.
 */
import { PostHog } from 'posthog-js'
import { log, productanalytics } from 'armoury'
import * as auth from './auth'
import { UserAccount } from 'smuggler-api'

const kLogCategory = '[productanalytics/archaeologist/background]'

let _analytics: PostHog | null = null

export function register() {
  _analytics = productanalytics.make('archaeologist/background', {
    autocapture: false,
    capture_pageview: false,
  })
  auth.observe({
    onLogin: (account: UserAccount) => {
      if (_analytics == null) {
        return
      }
      log.debug(`${kLogCategory} Identified user as ${account.getUid()}`)
      productanalytics.identifyUser({
        analytics: _analytics,
        userUid: account.getUid(),
      })
    },
    onLogout: () => {
      if (_analytics == null) {
        return
      }
      log.debug(`${kLogCategory} Reset user identity to anonymous on logout`)
      _analytics.reset()
    },
  })
}

export function analytics(): PostHog | null {
  return _analytics
}
