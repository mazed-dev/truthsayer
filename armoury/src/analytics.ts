/**
 * Module with utilities related to the domain of Product Analytics
 * such as user behaviour tracking.
 *
 * See https://posthog.com/ for more information.
 */

import posthog, { PostHog } from 'posthog-js'

import { errorise } from './exception'
import { log } from './log'

export function makeAnalytics(): PostHog | null {
  try {
    const analytics = posthog.init(
      'phc_p8GUvTa63ZKNpa05iuGI7qUvXYyyz3JG3UWe88KT7yj',
      {
        api_host: 'https://eu.posthog.com',
        secure_cookie: true,
      }
    )
    if (!(analytics instanceof PostHog)) {
      throw new Error(`Product analytics object is not of expected type`)
    }
    log.debug(
      `Product analytics initialised, events will be published ` +
        `as anonymous until user is identified`
    )
    return analytics
  } catch (e) {
    log.warning(`Failed to init product analytics, error = ${errorise(e)}`)
  }
  return null
}
