import React from 'react'
import { log, unicodeText } from 'armoury'
import lodash from 'lodash'
import moment from 'moment'

import { exctractReadableTextFromPage } from './../extractor/webPageContent'
import { isPageAutosaveable } from './autosaveable'

/**
 * This is virtual element to wrap trackers of users activity on a page and
 * decision making to bookmark the page or quote some text on the page.
 */
export const ActivityTracker = ({
  registerAttentionTime,
  disabled,
}: {
  registerAttentionTime: (
    deltaSeconds: number,
    totalSecondsEstimation: number
  ) => void
  disabled?: boolean
}) => {
  if (
    disabled ||
    !isPageAutosaveable(window.location.toString(), window.document)
  ) {
    return null
  }
  return <AttentionTimeTracker registerAttentionTime={registerAttentionTime} />
}

const kActivityTimeIncrementStep = moment.duration({ seconds: 3 })
const kActivityTimeReportStep = moment.duration({ seconds: 24 })
type AttentionTime = {
  totalSeconds: number
  deltaSeconds: number
}

/**
 * This is virtual element to wrap trackers of users activity on a page and
 * decision making to bookmark the page or quote some text on the page.
 */
const AttentionTimeTracker = ({
  registerAttentionTime,
}: {
  registerAttentionTime: (
    deltaSeconds: number,
    totalSecondsEstimation: number
  ) => void
}) => {
  // Save total reading time as a number to avoid difficulties with algebraic
  // operations with it
  const setTotalReadingTime = React.useState<AttentionTime>({
    totalSeconds: 0,
    deltaSeconds: 0,
  })[1]
  const totalReadingTimeEstimation = React.useMemo(() => {
    // TODO(akindyakov): This is quite expensive call to do on every open page,
    // ideally we could do it only if user spend more that 12 seconds on a page,
    // see `checkReadingTotalTime` for more details.
    // We simply don't have time for it today, but we will get back to fix it
    // if it becomes a problem.
    const text = exctractReadableTextFromPage(document)
    const estimation = unicodeText.getTimeToRead(text)
    log.info('Page estimated reading time in seconds', estimation.asSeconds())
    return estimation
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkReadingTotalTime = React.useCallback(
    lodash.throttle(() => {
      // Every X * 1000 milliseconds of activity increase total time counter by
      // X seconds, this is indirect way to measure active reading time.
      setTotalReadingTime(({ totalSeconds, deltaSeconds }: AttentionTime) => {
        const totalTimeEstimationSeconds =
          totalReadingTimeEstimation.asSeconds()
        const reportStepSeconds = kActivityTimeReportStep.asSeconds()
        const incrementStepSeconds = kActivityTimeIncrementStep.asSeconds()
        totalSeconds += incrementStepSeconds
        deltaSeconds += incrementStepSeconds
        if (
          deltaSeconds >= reportStepSeconds ||
          totalSeconds >= totalTimeEstimationSeconds
        ) {
          registerAttentionTime(deltaSeconds, totalTimeEstimationSeconds)
          deltaSeconds = 0
          if (totalSeconds >= totalTimeEstimationSeconds) {
            totalSeconds = 0
          }
        }
        log.debug(
          'New reading time in seconds',
          deltaSeconds,
          totalSeconds,
          totalTimeEstimationSeconds
        )
        return { totalSeconds, deltaSeconds }
      })
    }, kActivityTimeIncrementStep.asMilliseconds()),
    [totalReadingTimeEstimation]
  )
  React.useEffect(() => {
    // Add and remove activity listeners
    const mouseMoveListener = (/*ev: MouseEvent*/) => {
      checkReadingTotalTime()
    }
    const scrollListener = (/*ev: Event*/) => {
      checkReadingTotalTime()
    }
    document.addEventListener('mousemove', mouseMoveListener, { passive: true })
    document.addEventListener('scroll', scrollListener, { passive: true })
    return () => {
      checkReadingTotalTime.cancel()
      document.removeEventListener('mousemove', mouseMoveListener)
      document.removeEventListener('scroll', scrollListener)
    }
  }, [checkReadingTotalTime])
  return <></>
}
