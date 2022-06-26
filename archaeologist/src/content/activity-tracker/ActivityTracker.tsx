import React from 'react'
import { log } from 'armoury'
import lodash from 'lodash'
import moment from 'moment'
import { HoverTooltip } from 'elementary'

import { exctractReadableTextFromPage } from './../extractor/webPageContent'
import { getTimeToRead } from './reading-stats'
import { isPageReadable } from './unreadable'
import { Toast } from './../toaster/Toaster'
import { TextItem, ButtonItem, LogoSmall } from './../style'

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

const kActivityTimerStep = moment.duration({ seconds: 2 })

/**
 * This is virtual element to wrap trackers of users activity on a page and
 * decision making to bookmark the page or quote some text on the page.
 */
const ReadingTimeTracker = ({ bookmarkPage }: { bookmarkPage: () => void }) => {
  // Save total reading time as a number to avoid difficulties with algebraic
  // operations with it
  const [totalReadingTimeSeconds, addTotalReadingTime] = React.useReducer(
    (state: number, delta: moment.Duration) => state + delta.asSeconds(),
    0
  )
  const [disabled, setDisabled] = React.useState(false)
  const totalReadingTimeEstimation = React.useMemo(() => {
    // TODO(akindyakov): This is quite expensive call to do on every open page,
    // ideally we could do it only if user spend more that 12 seconds on a page,
    // see `checkReadingTotalTime` for more details.
    // We simply don't have time for it today, but we will get back to fix it
    // if it becomes a problem.
    const text = exctractReadableTextFromPage(document)
    const estimation = getTimeToRead(text)
    log.debug('Page estimated reading time, seconds', estimation.asSeconds())
    // But who are we lying to, we have an attention span of a golden fish, if
    // we spend more than 2 minutes on something, that's already a big
    // achievement. So limit reading time by that.
    // Also, we are limiting minimal time by 10 seconds, to avoid immidiatelly
    // saving pages without text at all.
    if (estimation.asMinutes() > 2) {
      return moment.duration({ minutes: 2, seconds: 4 })
    } else if (estimation.asSeconds() < 10) {
      return moment.duration({ seconds: 10 })
    }
    return estimation
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkReadingTotalTime = React.useCallback(
    lodash.throttle(() => {
      // Every X * 1000 milliseconds of activity increase total time counter by
      // X seconds, this is indirect way to measure active reading time.
      log.debug(
        'Increase the reading counter by',
        kActivityTimerStep.asSeconds()
      )
      addTotalReadingTime(kActivityTimerStep)
    }, kActivityTimerStep.asMilliseconds()),
    [totalReadingTimeEstimation]
  )
  React.useEffect(() => {
    if (
      !disabled &&
      totalReadingTimeSeconds >= totalReadingTimeEstimation.asSeconds()
    ) {
      log.debug('Time is up, bookmark the page', totalReadingTimeSeconds)
      bookmarkPage()
      setDisabled(true)
    }
  }, [
    totalReadingTimeEstimation,
    totalReadingTimeSeconds,
    bookmarkPage,
    disabled,
  ])
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
  if (disabled) {
    return null
  }
  return (
    <>
      <Toast id={'activity-tracker-status'}>
        <LogoSmall />
        <ReadingTimeLeftItem
          totalReadingTime={moment.duration({
            seconds: totalReadingTimeSeconds,
          })}
          totalReadingTimeEstimation={totalReadingTimeEstimation}
        />
        <ButtonItem
          onClick={() => {
            bookmarkPage()
            setDisabled(true)
          }}
        >
          Add
        </ButtonItem>
        <ButtonItem
          onClick={() => {
            setDisabled(true)
          }}
        >
          Cancel
        </ButtonItem>
      </Toast>
    </>
  )
}

const ReadingTimeLeftItem = ({
  totalReadingTime,
  totalReadingTimeEstimation,
}: {
  totalReadingTime: moment.Duration
  totalReadingTimeEstimation: moment.Duration
}) => {
  const readingTimeLeft = totalReadingTimeEstimation
    .clone()
    .subtract(totalReadingTime)
  const tooltip = `${timeLeftPrettyFull(
    readingTimeLeft
  )} reading time left until page is added to your timeline`
  return (
    <TextItem>
      <HoverTooltip tooltip={tooltip}>
        {timeLeftPrettyShort(readingTimeLeft)}
      </HoverTooltip>
    </TextItem>
  )
}

const timeLeftPrettyShort = (readingTimeLeft: moment.Duration): string => {
  if (readingTimeLeft.asMinutes() > 1) {
    return `⏱  ${Math.floor(readingTimeLeft.asMinutes())} min`
  }
  return `⏱  ${Math.floor(readingTimeLeft.asSeconds())} sec`
}

const timeLeftPrettyFull = (readingTimeLeft: moment.Duration): string => {
  let parts: string[] = []
  const hours = Math.floor(readingTimeLeft.asHours())
  const minutes = Math.floor(readingTimeLeft.asMinutes()) - hours * 60
  const seconds =
    Math.floor(readingTimeLeft.asSeconds()) - hours * 60 - minutes * 60
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (seconds > 0) {
    parts.push(`${seconds}s`)
  }
  return parts.join(' ')
}
