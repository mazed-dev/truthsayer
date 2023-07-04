import React from 'react'
import lodash from 'lodash'

import { log } from 'armoury'

import { FromContent } from '../../message/types'

import { AugmentationElement } from './Mount'

export function LinkHoverCard() {
  const requestSavedPageNode = React.useMemo(
    // Using `useMemo` instead of `useCallback` to avoid eslint complains
    // https://kyleshevlin.com/debounce-and-throttle-callbacks-with-react-hooks
    () =>
      lodash.debounce(
        async (element?: HTMLLinkElement) => {
          if (element != null && element.href) {
            const resp = await FromContent.sendMessage({
              type: 'REQUEST_PAGE_NODE_BY_URL',
              url: element.href,
            })
            log.debug('Resp', resp)
          }
        },
        400,
        { maxWait: 600 }
      ),
    []
  )
  React.useEffect(() => {
    const callback = (event: MouseEvent) => {
      if (event.target) {
        const element = event.target as HTMLElement
        let refElement: HTMLLinkElement | undefined = undefined
        if (element.tagName === 'A') {
          refElement = element as HTMLLinkElement
        }
        if (element.parentElement?.tagName === 'A') {
          refElement = element.parentElement as HTMLLinkElement
        }
        requestSavedPageNode(refElement)
        if (refElement != null) {
          log.debug('Mouse hover element', refElement.href)
        }
      }
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('mouseover', callback, opts)
    return () => {
      window.removeEventListener('mouseover', callback, opts)
    }
  }, [requestSavedPageNode])
  return <AugmentationElement disableInFullscreenMode></AugmentationElement>
}
