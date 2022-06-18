import React, { useState, useEffect } from 'react'
import { log } from 'armoury'

/**
 * This is virtual element to pack up detection of pages to save
 */
export const ReadingDetector = () => {
  const mouseMoveListener = (/*ev: MouseEvent*/) => {
    // log.debug('Mazed.ReadingDetector.mouseMoveListener', ev)
  }
  const clipboardCopyListener = (ev: ClipboardEvent) => {
    log.debug('Mazed.ReadingDetector.clipboardCopyListener', ev)
  }
  const scrollListener = (ev: Event) => {
    log.debug('Mazed.ReadingDetector.scrollListener', ev)
  }
  // Add and remove activity listeners
  useEffect(() => {
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
