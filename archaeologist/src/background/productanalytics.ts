/**
 * Wrapper around @see armoury.productanalytics tailored to needs
 * specific to the background script.
 */
import { PostHog } from 'posthog-js'
import { log, productanalytics } from 'armoury'
import * as auth from './auth'
import { UserAccount } from 'smuggler-api'

const kLogCategory = '[productanalytics/archaeologist/background]'

let _analytics: PostHog | null = null

function register() {
  const account = auth.account()
  _analytics = productanalytics.make(
    'archaeologist/background',
    process.env.NODE_ENV,
    {
      autocapture: false,
      capture_pageview: false,
      bootstrap: account.isAuthenticated()
        ? {
            distinctID: productanalytics.identity.fromUserId(
              account.getUid(),
              process.env.NODE_ENV
            ),
            isIdentifiedID: true,
          }
        : undefined,
      // See https://posthog.com/docs/integrate/client/js#identifying-users
      // for more information on why it may not be a good idea to call
      // 'auth.observe()' immediately after analytics instances has been created
      loaded: startObservingAuth,
      // All other available types of PostHog persistence seem to rely
      // on browser APIs that are not available within background script, like
      // 'window.localStorage', 'cookieStore' etc. Note that conceptually
      // some of these APIs may be available to background scripts, but the way
      // PostHog accesses them is not (e.g. cookies are accessible via
      // 'browser.cookies', but PostHog uses 'cookieStore').
      persistence: 'memory',
    }
  )
}

function startObservingAuth() {
  auth.observe({
    onLogin: (account: UserAccount) => {
      if (_analytics == null) {
        return
      }
      log.debug(`${kLogCategory} Identified user as ${account.getUid()}`)
      productanalytics.identifyUser({
        analytics: _analytics,
        env: process.env.NODE_ENV,
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

export const backgroundpa = {
  register,
  instance: () => _analytics,
}
