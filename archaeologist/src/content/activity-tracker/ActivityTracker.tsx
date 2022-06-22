import React from 'react'
import { log } from 'armoury'
import lodash from 'lodash'
import moment from 'moment'

import { exctractReadableTextFromPage } from './../extractor/webPageContent'
import { getTimeToRead } from './reading-stats'
import { isPageReadable } from './unreadable'
import { ToastContext } from './../toaster/Toaster'

/**
 * This is virtual element to wrap trackers of users activity on a page and
 * decision making to bookmark the page or quote some text on the page.
 */
export const ActivityTracker = ({
  bookmarkPage,
  disabled,
}: {
  bookmarkPage: () => void
  disabled?: boolean
}) => {
  if (disabled || !isPageReadable(window.location.toString())) {
    return null
  }
  return <ReadingTimeTracker bookmarkPage={bookmarkPage} />
}

/**
 * This is virtual element to wrap trackers of users activity on a page and
 * decision making to bookmark the page or quote some text on the page.
 */
const ReadingTimeTracker = ({ bookmarkPage }: { bookmarkPage: () => void }) => {
  const [, setTotalReadingTime] = React.useState<number>(0) // seconds
  const readingTimeEstimation = React.useMemo(() => {
    // TODO(akindyakov): This is quite expensive call to do on every open page,
    // ideally we could do it only if user spend more that 12 seconds on a page,
    // see `checkReadingTotalTime` for more details.
    // We simply don't have time for it today, but we will get back to fix it
    // if it becomes a problem.
    const text = exctractReadableTextFromPage(document)
    const estimation = getTimeToRead(text).asSeconds()
    log.debug('Page estimated reading time, seconds', estimation)
    // But who are we lying to, we have an attention span of a golden fish, if
    // we spend more than 2 minutes on something, that's already a big
    // achievement. So limit reading time by that.
    // Also, we are limiting minimal time by 10 seconds, to avoid immidiatelly
    // saving pages without text at all.
    return Math.max(10, Math.min(120, estimation))
  }, [])
  const toaster = React.useContext(ToastContext)
  const checkReadingTotalTime = React.useMemo(() => {
    const timerStep = moment.duration(2, 'seconds')
    return lodash.throttle(
      () => {
        setTotalReadingTime((totalReadingTime: number) => {
          // Every X * 1000 milliseconds of activity increase total time counter by
          // X seconds, this is indirect way to measure active reading time.
          log.debug(
            'User is actively reading the page, reading time',
            totalReadingTime,
            readingTimeEstimation
          )
          log.debug('Upsert')
          const key = toaster.upsert(<span>{totalReadingTime}/{readingTimeEstimation}</span>, 'abc')
          log.debug('Upserted', key)
          if (totalReadingTime >= readingTimeEstimation) {
            log.debug(
              `📒 User spent ${totalReadingTime}s reading the page, it exceeds predicted time - ${readingTimeEstimation}s. Saving page as a bookmark to Mazed`
            )
            bookmarkPage()
          }
          return totalReadingTime + timerStep.asSeconds()
        })
      },
      timerStep.asMilliseconds(),
      {
        leading: true,
        trailing: false,
      }
    )
  }, [readingTimeEstimation, bookmarkPage])
  // Add and remove activity listeners
  React.useEffect(() => {
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
