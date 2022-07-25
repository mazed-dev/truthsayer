import { TotalUserActivity } from 'smuggler-api'
import { log } from 'armoury'

import moment from 'moment'

export function isReadyToBeAutoSaved(
  userActivity: TotalUserActivity,
  totalAttentionTimeEstimationSeconds: number
): boolean {
  if (
    userActivity.seconds_of_attention >=
    Math.max(24, Math.min(totalAttentionTimeEstimationSeconds, 120))
  ) {
    // But who are we lying to, we have an attention span of a golden fish, if
    // we spend more than 2 minutes on something, that's already a big
    // achievement. So limit reading time by that.
    // Also, we are limiting minimal time by 30 seconds, to avoid immidiatelly
    // saving pages without text at all.
    log.debug(
      'Page has got enough attention time to be auto saved',
      userActivity.seconds_of_attention,
      totalAttentionTimeEstimationSeconds
    )
    return true
  }
  const visitMoments = userActivity.visits.map((v) => moment.unix(v.timestamp))
  const dayLimit = moment().subtract(24, 'hours')
  const dayVisits = visitMoments.reduce<number>(
    (acc: number, visitMoment: moment.Moment) => {
      if (visitMoment.isAfter(dayLimit)) {
        return acc + 1
      } else {
        return acc
      }
    },
    0
  )
  const weekLimit = moment().subtract(7, 'days')
  const weekVisits = visitMoments.reduce<number>(
    (acc: number, visitMoment: moment.Moment) => {
      if (visitMoment.isAfter(weekLimit)) {
        return acc + 1
      } else {
        return acc
      }
    },
    0
  )
  if (dayVisits >= 3 || weekVisits >= 4) {
    log.debug(
      'Page has been visited enough times to be auto saved',
      dayVisits,
      weekVisits,
      visitMoments
    )
    return true
  }
  return false
}

const _openTabUrls: Record<number, string | undefined> = {}
/**
 * Track URL's of opened tabs to detect a new visit
 *
 * [akindyakov@] Listening to `browser.tabs.onUpdated` events proved to be not
 * sufficient because we can't distinguish a plain page reload or instant jump
 * back and forth in history from an actual new visit.
 */
export function isTabUrlUpdated(
  tabId: number,
  url: string | undefined
): boolean {
  const prevUrl = _openTabUrls[tabId]
  if (prevUrl !== url) {
    _openTabUrls[tabId] = url
    return true
  }
  return false
}
