/**
 * Module with utilities related to the domain of Product Analytics
 * such as user behaviour tracking.
 *
 * See https://posthog.com/ for more information.
 */

import { posthog, PostHog, PostHogConfig } from 'posthog-js'

import { errorise } from './exception'
import { log } from './log'
import { v4 as uuidv4 } from 'uuid'

const kLogCategory = '[productanalytics]'
const kIdentityEnvPrefix = process.env.NODE_ENV === 'development' ? 'dev/' : ''

/**
 * Create an instance of PostHog analytics.
 * @param analyticsContextName name that PostHog will use to cache the instance
 * internally.
 */
function makeAnalytics(
  analyticsContextName: string,
  config?: Partial<PostHogConfig>
): PostHog | null {
  const logPrefix = `${kLogCategory} '${analyticsContextName}'`
  const previouslyCreatedInstance: PostHog | undefined =
    // @ts-ignore: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type 'PostHog'
    posthog[analyticsContextName]
  if (previouslyCreatedInstance != null) {
    log.debug(
      `${logPrefix} Attempted to init more than once, returning previously cached instance`
    )
    return previouslyCreatedInstance
  }

  const userIdBootstrap = config?.bootstrap?.isIdentifiedID
    ? config.bootstrap
    : {
        distinctID: `${kIdentityEnvPrefix}${uuidv4()}`, // anonymous ID
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
      // Exclude user's IP address from events (below options don't
      // appear to work, instead this is controlled via a toggle in
      // project settings in https://eu.posthog.com/project/settings)
      // ip: false,
      // property_blacklist: ['$ip'],
    }
    const ret = posthog.init(posthogToken, finalConfig, analyticsContextName)
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
    return ret
  } catch (e) {
    log.warning(`${logPrefix} Failed to init, error = ${errorise(e)}`)
  }
  return null
}

function identifyUser({
  analytics,
  userUid,
}: {
  analytics: PostHog
  userUid: string
}) {
  const logPrefix = `${kLogCategory} '${analytics.get_config('name')}'`
  const identity = makePostHogIdentityFromUserUid(userUid)
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

function makePostHogIdentityFromUserUid(userUid: string) {
  return `${kIdentityEnvPrefix}${userUid}`
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
