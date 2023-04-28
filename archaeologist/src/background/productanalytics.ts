/**
 * Wrapper around @see armoury.productanalytics tailored to needs
 * specific to the background script.
 */
import { PostHog } from 'posthog-node'
import browser from 'webextension-polyfill'
import { v4 as uuidv4 } from 'uuid'
import { log, errorise, productanalytics, isAnalyticsIdentity } from 'armoury'
import type { AnalyticsIdentity } from 'armoury'

const kLogCategory = '[productanalytics/archaeologist/background]'

async function make(identity: AnalyticsIdentity): Promise<PostHog | null> {
  // PostHog token and API host URL can be found at https://eu.posthog.com/project/settings
  const posthogToken = 'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj'
  const posthogApiHost = 'https://eu.posthog.com'
  try {
    return new PostHog(posthogToken, {
      host: posthogApiHost,
      bootstrap: {
        distinctId: identity.analyticsIdentity,
        isIdentifiedId: true,
      },
      disableGeoip: true,
      fetch: (url, options) => {
        return fetch(url, options)
      },
    })
  } catch (reason) {
    log.debug(
      `${kLogCategory} Failed to create an instance: ${
        errorise(reason).message
      }`
    )
    return null
  }
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
