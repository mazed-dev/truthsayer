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
const kIdentityEnvPrefix =
  process.env.NODE_ENV === 'development' ? 'dev' : 'mazed.se'

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

  const anonymousUserId = `${kIdentityEnvPrefix}/anonymous/${uuidv4()}`
  try {
    // PostHog token and API host URL can be found at https://eu.posthog.com/project/settings
    const posthogToken = 'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj'
    const posthogApiHost = 'https://eu.posthog.com'
    const ret = posthog.init(
      posthogToken,
      {
        api_host: posthogApiHost,
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies
        secure_cookie: true,
        // Exclude user's IP address from events
        ip: false,
        // Respect user's "Do Not Track" choice
        respect_dnt: true,
        bootstrap: {
          distinctID: anonymousUserId,
        },
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
  const analyticsId = `${kIdentityEnvPrefix}/${obfuscateEmail(
    userEmail
  )}/${userUid}`
  try {
    analytics.identify(analyticsId)
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

export const productanalytics = {
  make: makeAnalytics,
  identifyUser: identifyUser,
}
