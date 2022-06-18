import React from 'react'
import { log } from 'armoury'
import lodash from 'lodash'

/**
 * This is virtual element to pack up detection of pages to save
 */
export const ReadingDetector = ({ onSavePage }: { onSavePage: () => void }) => {
  const [readingTime, setReadingTime] = React.useState<number>(0) // seconds
  const checkReadingTotalTime = lodash.throttle(
    () => {
      setReadingTime((v: number) => {
        // Every X * 1000 milliseconds of activity increase total time counter by
        // X seconds, this is indirect way to measure active reading time.
        v = v + 2
        log.debug('checkReadingTotalTime', v)
        if (v > 60) {
          onSavePage()
        }
        return v
      })
    },
    2000,
    {}
  )
  const mouseMoveListener = (/*ev: MouseEvent*/) => {
    checkReadingTotalTime()
  }
  const scrollListener = (/*ev: Event*/) => {
    checkReadingTotalTime()
  }
  const clipboardCopyListener = (/*ev: ClipboardEvent*/) => {}
  // Add and remove activity listeners
  React.useEffect(() => {
    document.addEventListener('mousemove', mouseMoveListener, { passive: true })
    document.addEventListener('copy', clipboardCopyListener, { passive: true })
    document.addEventListener('scroll', scrollListener, { passive: true })
    return () => {
      document.removeEventListener('mousemove', mouseMoveListener)
      document.removeEventListener('copy', clipboardCopyListener)
      document.removeEventListener('scroll', scrollListener)
    }
  }, [])
  return <></>
}
