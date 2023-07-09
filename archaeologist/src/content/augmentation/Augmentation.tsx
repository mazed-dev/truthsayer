import React from 'react'
import { isPageWriteAugmentable } from './augmentable'
import type { Nid } from 'smuggler-api'
import { log } from 'armoury'
import { SuggestedRelatives } from './SuggestedRelatives'
import { LinkHoverCard } from './LinkHoverCard'

export function Augmentation({
  stableUrl,
  excludeNids,
  tabTitleUpdateCounter,
  enableTypingSuggestions,
  enableMouseoverSuggestions,
}: {
  stableUrl?: string
  excludeNids?: Nid[]
  tabTitleUpdateCounter: number
  enableTypingSuggestions: boolean
  enableMouseoverSuggestions: boolean
}) {
  if (stableUrl == null) {
    log.debug("There is no URL, can't give suggestions")
    return null
  }
  if (!isPageWriteAugmentable(stableUrl)) {
    log.debug(`Suggestions are manually disabled for the page "${stableUrl}"`)
    return null
  }
  if (!enableTypingSuggestions) {
    log.debug('Suggestions are manually disabled in settings')
    return null
  }
  return (
    <>
      {enableTypingSuggestions ? (
        <SuggestedRelatives
          stableUrl={stableUrl}
          excludeNids={excludeNids}
          tabTitleUpdateCounter={tabTitleUpdateCounter}
        />
      ) : null}
      {enableMouseoverSuggestions ? <LinkHoverCard /> : null}
    </>
  )
}
