/**
 * Wrapper around @see armoury.productanalytics tailored to needs
 * specific to the background script.
 */
import { PostHog } from 'posthog-js'
import browser from 'webextension-polyfill'
import { v4 as uuidv4 } from 'uuid'
import { log, errorise, productanalytics, isAnalyticsIdentity } from 'armoury'
import type { AnalyticsIdentity } from 'armoury'

const kLogCategory = '[productanalytics/archaeologist/background]'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function make(identity: AnalyticsIdentity): Promise<PostHog | null> {
  // If product analytics can't be initialised for a considerable amount of time
  // then it most likely means that something went wrong in PostHog and it failed
  // to asyncronously invoke its `loaded` parameter. Without a timeout this
  // can result in a never-ending wait.
  const timeout = new Promise<null>((resolve) => {
    sleep(2000).then(() => resolve(null))
  })
  const result = new Promise<PostHog | null>((resolve) =>
    productanalytics.make('archaeologist/background', process.env.NODE_ENV, {
      autocapture: false,
      capture_pageview: false,
      // See https://posthog.com/docs/integrate/client/js#identifying-users
      // for more information on why it may not be a good idea to return
      // and use a PostHog instance immediately, even though its creation is
      // synchronous
      loaded: (analytics: PostHog) => resolve(analytics),
      bootstrap: {
        distinctID: identity.analyticsIdentity,
        isIdentifiedID: true,
      },
      // All other available types of PostHog persistence seem to rely
      // on browser APIs that are not available within background script, like
      // 'window.localStorage', 'cookieStore' etc. Note that conceptually
      // some of these APIs may be available to background scripts, but the way
      // PostHog accesses them is not (e.g. cookies are accessible via
      // 'browser.cookies', but PostHog uses 'cookieStore').
      persistence: 'memory',
      // Attempting to capture referrer data within background script breaks PostHog,
      // but that's not really an issue because the whole "URL which referred user
      // to current URL" does not make sense within background.
      save_referrer: false,
    })
  ).catch((reason) => {
    log.debug(
      `${kLogCategory} Failed to create an instance: ${
        errorise(reason).message
      }`
    )
    return null
  })
  return Promise.race([result, timeout])
}

/**
 * Get a persistent ID which can be used to tie product analytics
 * events together across browser sessions.
 */
async function identity(
  browserStore: browser.Storage.StorageArea
): Promise<AnalyticsIdentity> {
  const key = 'background-productanalytics-uuid'
  const records = await browserStore.get(key)
  if (records && key in records && isAnalyticsIdentity(records[key])) {
    return records[key]
  }

  const ret = productanalytics.identity.from(uuidv4(), process.env.NODE_ENV)
  await browserStore.set({ [key]: ret })
  return ret
}

export const backgroundpa = {
  make,
  getIdentity: identity,
}
