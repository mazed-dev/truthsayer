import { TotalUserActivity } from 'smuggler-api'
import { log } from 'armoury'

import moment from 'moment'

const kAttentionTimeSecondsMin = 8
const kAttentionTimeSecondsMax = 30

/**
 * Filter out visits that are too close to each other (~1 min)
 * Expects sorted input!
 */
export function filterAttentionSpans(
  moments: moment.Moment[]
): moment.Moment[] {
  let lastAttentionSpanStart: moment.Moment = moment.unix(0)
  return moments.filter((m: moment.Moment) => {
    if (moment.duration(m.diff(lastAttentionSpanStart)).asSeconds() > 59) {
      lastAttentionSpanStart = m
      return true
    }
    return false
  })
}

export function countMomentsAfterX(
  moments: moment.Moment[],
  x: moment.Moment
): number {
  return moments.reduce<number>((acc: number, visitMoment: moment.Moment) => {
    if (visitMoment.isAfter(x)) {
      return acc + 1
    } else {
      return acc
    }
  }, 0)
}

export function isReadyToBeAutoSaved(
  userActivity: TotalUserActivity,
  totalAttentionTimeEstimationSeconds: number
): boolean {
  if (
    userActivity.seconds_of_attention >=
    Math.max(
      kAttentionTimeSecondsMin,
      Math.min(totalAttentionTimeEstimationSeconds, kAttentionTimeSecondsMax)
    )
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
  // Sort it first and then convert to Moment objects
  const visitMoments = filterAttentionSpans(
    userActivity.visits
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((v) => moment.unix(v.timestamp))
  )
  const dayVisits = countMomentsAfterX(
    visitMoments,
    moment().subtract(24, 'hours')
  )
  const weekVisits = countMomentsAfterX(
    visitMoments,
    moment().subtract(7, 'days')
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
