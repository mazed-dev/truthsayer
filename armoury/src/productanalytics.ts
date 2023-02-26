/**
 * Module with utilities related to the domain of Product Analytics
 * such as user behaviour tracking.
 *
 * See https://posthog.com/ for more information.
 */

import { posthog, PostHog } from 'posthog-js'
import type { PostHogConfig } from 'posthog-js'

import { errorise } from './exception'
import { log } from './log'

const kLogCategory = '[productanalytics]'

export type NodeEnv = 'development' | 'production' | 'test'

/**
 * Create an instance of PostHog analytics.
 * @param analyticsSourceName name that PostHog will use to cache the instance
 * internally.
 */
function makeAnalytics(
  analyticsSourceName: string,
  nodeEnv: NodeEnv,
  config?: Partial<PostHogConfig>
): PostHog | null {
  const logPrefix = `${kLogCategory} '${analyticsSourceName}'`
  const previouslyCreatedInstance: PostHog | undefined =
    // @ts-ignore: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type 'PostHog'
    posthog[analyticsSourceName]
  if (previouslyCreatedInstance != null) {
    log.debug(
      `${logPrefix} Attempted to init more than once, returning previously cached instance`
    )
    if (config?.loaded != null) {
      config.loaded(previouslyCreatedInstance)
    }
    return previouslyCreatedInstance
  }

  try {
    // PostHog token and API host URL can be found at https://eu.posthog.com/project/settings
    const posthogToken = 'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj'
    const posthogApiHost = 'https://eu.posthog.com'
    const finalConfig: Partial<PostHogConfig> = {
      ...config,
      api_host: posthogApiHost,
      // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies
      secure_cookie: true,
      // Not much documentation about this PostHog feature, but seemingly it referrs
      // to ad campaigns. See https://support.google.com/analytics/answer/1033863?hl=en#zippy=%2Cin-this-article
      // and https://github.com/PostHog/posthog-js/blob/ac546fd4ed674e8771f4c28329ac6c91b3e14483/src/posthog-core.ts#L770-L772
      // for more information
      store_google: false,
      // Exclude user's IP address from events (below options don't
      // appear to work, instead this is controlled via a toggle in
      // project settings in https://eu.posthog.com/project/settings)
      // ip: false,
      // property_blacklist: ['$ip'],
    }
    const ret = posthog.init(posthogToken, finalConfig, analyticsSourceName)
    if (!(ret instanceof PostHog)) {
      throw new Error(`${logPrefix} Object is not of expected type`)
    }

    ret.register({ source: analyticsSourceName, environment: nodeEnv })
    return ret
  } catch (e) {
    log.warning(`${logPrefix} Failed to init, error = ${errorise(e)}`)
  }
  return null
}

/**
 * Modify an HTML 'class' string such that the contents of anything in
 * an HTML subtree with this class name would be excluded from PostHog's
 * auto-capture feature.
 *
 * Note that this seemingly excludes *events* related to the affected HTML subtree,
 * not just *data* in it. This means that it should be applied carefully,
 * not to accidentally exclude large chunks of UIs.
 */
function markClassNameForExclusion(className?: string): string {
  // See https://posthog.com/docs/integrate/client/js#autocapture for more information
  if (className == null || className.length === 0) {
    return 'ph-no-capture'
  }
  return `ph-no-capture ${className}`
}

export const productanalytics = {
  make: makeAnalytics,
  classExclude: markClassNameForExclusion,
}
