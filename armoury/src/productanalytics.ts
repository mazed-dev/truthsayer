/**
 * Module with utilities related to the domain of Product Analytics
 * such as user behaviour tracking.
 *
 * See https://posthog.com/ for more information.
 */

import posthog, { PostHog } from 'posthog-js'

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
function makeAnalytics(analyticsContextName: string): PostHog | null {
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

  const anonymousUserId = `${kIdentityEnvPrefix}${uuidv4()}`
  try {
    // PostHog token and API host URL can be found at https://eu.posthog.com/project/settings
    const posthogToken = 'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj'
    const posthogApiHost = 'https://eu.posthog.com'
    const ret = posthog.init(
      posthogToken,
      {
        api_host: posthogApiHost,
        bootstrap: {
          distinctID: anonymousUserId,
          isIdentifiedID: false,
        },
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies
        secure_cookie: true,
        // Respect user's "Do Not Track" choice
        respect_dnt: true,
        // Exclude user's IP address from events (below options doesn't
        // appear to work, instead this is controlled via a toggle in
        // project settings in https://eu.posthog.com/project/settings)
        // ip: false,
        // property_blacklist: ['$ip'],
      },
      analyticsContextName
    )
    if (!(ret instanceof PostHog)) {
      throw new Error(`${logPrefix} Object is not of expected type`)
    }
    log.debug(
      `${logPrefix} initialised, until user is identified events will be` +
        ` published as ${anonymousUserId}`
    )
    return ret
  } catch (e) {
    log.warning(`${logPrefix} Failed to init, error = ${errorise(e)}`)
  }
  return null
}

function identifyUser({
  analytics,
  userEmail,
  userUid,
}: {
  analytics: PostHog
  userEmail: string
  userUid: string
}) {
  const logPrefix = `${kLogCategory} '${analytics.get_config('name')}'`
  const email = obfuscateEmail(userEmail)
  const analyticsId = `${kIdentityEnvPrefix}${userUid}`
  try {
    analytics.identify(analyticsId, { email, uid: userUid })
    log.debug(
      `${logPrefix} Valid user account, future events will be identified as '${analyticsId}'`
    )
  } catch (e) {
    log.warning(
      `${logPrefix} Failed to identify user as ${analyticsId}: ${errorise(e)}`
    )
  }
}

/**
 * Replace most of the email address contents with dummy symbols to make it
 * safe to publish alongside analytics events.
 *
 * User's UID (@see AccountInterface.getUid() )
 */
function obfuscateEmail(email: string): string {
  let ret = ''
  const atIndex = email.indexOf('@')
  if (atIndex === -1 || atIndex === 0) {
    return 'invalid@email.com'
  }
  {
    const lengthOfName = atIndex
    const lettersToKeep = lengthOfName > 4 ? 2 : 0
    const lettersToObfuscate = lengthOfName - lettersToKeep
    ret = email.replace(
      email.substr(lettersToKeep, lengthOfName - lettersToKeep),
      '*'.repeat(lettersToObfuscate)
    )
  }

  {
    const lengthOfDomain = email.length - (atIndex + 1)
    const lettersToKeep = lengthOfDomain > 4 ? 2 : 0
    const lettersToObfuscate = lengthOfDomain - lettersToKeep
    ret = ret.replace(
      email.substr(atIndex + 1 + lettersToKeep, lengthOfDomain - lettersToKeep),
      '*'.repeat(lettersToObfuscate)
    )
  }
  return ret
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
  identifyUser: identifyUser,
  exclude: markClassNameForExclusion,
}
