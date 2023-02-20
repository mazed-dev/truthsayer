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
import { v4 as uuidv4 } from 'uuid'

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

  const userIdBootstrap = config?.bootstrap?.isIdentifiedID
    ? config.bootstrap
    : {
        distinctID: makePostHogIdentityFromUserUid(uuidv4(), nodeEnv), // anonymous ID
        isIdentifiedID: false,
      }
  try {
    // PostHog token and API host URL can be found at https://eu.posthog.com/project/settings
    const posthogToken = 'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj'
    const posthogApiHost = 'https://eu.posthog.com'
    const finalConfig: Partial<PostHogConfig> = {
      ...config,
      bootstrap: userIdBootstrap,
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
    if (userIdBootstrap.isIdentifiedID) {
      log.debug(
        `${logPrefix} Valid user account, future events will be identified as '${userIdBootstrap.distinctID}'`
      )
    } else {
      log.debug(
        `${logPrefix} initialised, until user is identified events will be` +
          ` published as ${userIdBootstrap.distinctID}`
      )
    }
    ret.register({ source: analyticsSourceName })
    return ret
  } catch (e) {
    log.warning(`${logPrefix} Failed to init, error = ${errorise(e)}`)
  }
  return null
}

function identifyUser({
  analytics,
  nodeEnv,
  userUid,
}: {
  analytics: PostHog
  nodeEnv: NodeEnv
  userUid: string
}) {
  const logPrefix = `${kLogCategory} '${analytics.get_config('name')}'`
  const identity = makePostHogIdentityFromUserUid(userUid, nodeEnv)
  try {
    analytics.identify(identity, { uid: userUid })
    log.debug(
      `${logPrefix} Valid user account, future events will be identified as '${identity}'`
    )
  } catch (e) {
    log.warning(
      `${logPrefix} Failed to identify user as ${identity}: ${errorise(e)}`
    )
  }
}

function makePostHogIdentityFromUserUid(userUid: string, nodeEnv: NodeEnv) {
  // Note that this helper can't rely on process.env.NODE_ENV directly because
  // it's not available in all environments when product analytics are needed
  // (e.g. it is not available in content script)
  const envPrefix = nodeEnv !== 'production' ? 'dev/' : ''
  return `${envPrefix}${userUid}`
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
  identifyUser,
  classExclude: markClassNameForExclusion,
  identity: {
    fromUserId: makePostHogIdentityFromUserUid,
  },
}
