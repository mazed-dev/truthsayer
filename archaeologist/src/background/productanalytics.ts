/**
 * Wrapper around @see armoury.productanalytics tailored to needs
 * specific to the background script.
 */

import { PostHog as NodePostHog } from 'posthog-node'
import browser from 'webextension-polyfill'
import { v4 as uuidv4 } from 'uuid'
import {
  log,
  errorise,
  productanalytics,
  isAnalyticsIdentity,
  Timer,
} from 'armoury'
import type { AnalyticsIdentity } from 'armoury'

const kLogCategory = '[productanalytics/archaeologist/background]'

/**
 * As of posthog-node 3.1.0, @see EventMessageV1 is the type of the only input
 * parameter for @see PostHog.capture(). The type is not exported, but it can be
 * deduced manually
 */
type EventMessageV1 = Parameters<NodePostHog['capture']>[0]

/**
 * Properties that can be associated with a captured analytics event
 */
export type EventProperties = NonNullable<EventMessageV1['properties']>

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
    properties?: EventProperties,
    options?: CaptureOptions
  ) => void
  isFeatureEnabled: (key: string) => Promise<boolean | undefined>
}

async function make(
  identity: AnalyticsIdentity
): Promise<BackgroundPosthog | null> {
  // PostHog token and API host URL can be found at https://eu.posthog.com/project/settings
  const posthogToken = 'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj'
  const archaeologistVersion = browser.runtime.getManifest().version
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
            archaeologistVersion,
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

/**
 * A copy-paste of armoury.productanalytics.warning(), due to divergent
 * analytics types.
 */
function captureWarning(
  analytics: BackgroundPosthog | null,
  data: Parameters<typeof productanalytics['warning']>[1] & {
    location: 'background'
  },
  settings?: Parameters<typeof productanalytics['warning']>[2]
) {
  analytics?.capture('warning', {
    ...data,
    failedTo: `Failed to ${data.failedTo}`,
  })
  if (settings?.andLog) {
    log.error(
      `${data.location}: Failed to ${data.failedTo}, cause = '${data.cause}'`
    )
  }
}

/**
 * A copy-paste of armoury.productanalytics.warning(), due to divergent
 * analytics types.
 */
function captureError(
  analytics: BackgroundPosthog | null,
  data: Parameters<typeof productanalytics['error']>[1] & {
    location: 'background'
  },
  settings?: Parameters<typeof productanalytics['error']>[2]
) {
  analytics?.capture('error', {
    ...data,
    failedTo: `Failed to ${data.failedTo}`,
  })
  if (settings?.andLog) {
    log.error(
      `${data.location}: Failed to ${data.failedTo}, cause = '${data.cause}'`
    )
  }
}

function reportPerformance(
  analytics: BackgroundPosthog | null,
  data: {
    /** Performance of what action is being reported */
    action: string
  } & EventProperties,
  /** Timer which started counting when the action was started */
  timer: Timer,
  settings?: Parameters<typeof productanalytics['error']>[2]
): void {
  analytics?.capture(`performance measurement`, {
    ...data,
    action: data.action,
    durationMs: timer.elapsedMs(),
  })
  if (settings?.andLog) {
    const copy = { ...data }
    // @ts-ignore The operand of a 'delete' operator must be optional
    delete copy.action
    log.debug(
      `Performance: '${data.action}' - ${timer.elapsedSecondsPretty()}` +
        (Object.keys(copy).length > 0
          ? ` (props = ${JSON.stringify(copy)})`
          : '')
    )
  }
}

export const backgroundpa = {
  make,
  getIdentity: identity,
  warning: captureWarning,
  error: captureError,
  performance: reportPerformance,
}
