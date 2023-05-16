/**
 * Wrapper around @see armoury.productanalytics tailored to needs
 * specific to the background script.
 */

import { PostHog as NodePostHog } from 'posthog-node'
import browser from 'webextension-polyfill'
import { v4 as uuidv4 } from 'uuid'
import { log, errorise, productanalytics, isAnalyticsIdentity } from 'armoury'
import type { AnalyticsIdentity } from 'armoury'

const kLogCategory = '[productanalytics/archaeologist/background]'

/**
 * As of posthog-node 3.1.0, @see EventMessageV1 is the type of the only input
 * parameter for @see PostHog.capture(). The type is not exported, but it can be
 * deduced manually
 */
type EventMessageV1 = Parameters<NodePostHog['capture']>[0]

/**
 * All the properties of @see EventMessageV1 except the ones that in
 * case of @see PostHog.capture from 'posthog-js'
 *  - either get passed in as their own arguments dedicated arguments (like 'event')
 *  - or implicitely reused from the init procedure (like 'distinct_id')
 */
type CaptureOptions = Omit<
  EventMessageV1,
  'event' | 'distinct_id' | 'properties'
>
/**
 * A thin wrapper on top of @see NodePostHog to make its public API
 * more aligned with PostHog from 'posthog-js'
 */
export type BackgroundPosthog = {
  capture: (
    event_name: string,
    properties?: EventMessageV1['properties'],
    options?: CaptureOptions
  ) => void
  isFeatureEnabled: (key: string) => Promise<boolean | undefined>
}

async function make(
  identity: AnalyticsIdentity
): Promise<BackgroundPosthog | null> {
  // PostHog token and API host URL can be found at https://eu.posthog.com/project/settings
  const posthogToken = 'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj'
  try {
    const ret = new NodePostHog(posthogToken, {
      host: productanalytics.apiHost(),
      bootstrap: {
        distinctId: identity.analyticsIdentity,
        isIdentifiedId: true,
      },
      disableGeoip: true,
      fetch: (url, options) => {
        return fetch(url, options)
      },
    })
    return {
      capture: (
        event_name: string,
        properties?: EventMessageV1['properties'],
        options?: CaptureOptions
      ) => {
        ret.capture({
          event: event_name,
          ...options,
          properties: {
            // $user_id is a "native" property in 'posthog-js'
            // that seems to be used instead of 'distinct_id' in certain
            // UI views, even though their meaning is the same
            $user_id: identity.analyticsIdentity,
            // 'source' & 'environment' are custom properties, copy-pasted
            // from armoury.productanalytics.make()
            source: 'archaeologist/background',
            environment: process.env.NODE_ENV,
            ...properties,
          },
          distinctId: identity.analyticsIdentity,
        })
      },
      isFeatureEnabled: async (key: string): Promise<boolean | undefined> => {
        return await ret.isFeatureEnabled(key, identity.analyticsIdentity)
      },
    }
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
