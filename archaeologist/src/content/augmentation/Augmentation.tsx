import React from 'react'
import { isPageWriteAugmentable } from './augmentable'
import type { Nid } from 'smuggler-api'
import { SuggestedRelatives } from './SuggestedRelatives'

export function Augmentation({
  stableUrl,
  excludeNids,
  tabTitleUpdateCounter,
}: {
  stableUrl?: string
  excludeNids?: Nid[]
  tabTitleUpdateCounter: number
}) {
  if (stableUrl == null || !isPageWriteAugmentable(stableUrl)) {
    return null
  }
  return (
    <SuggestedRelatives
      stableUrl={stableUrl}
      excludeNids={excludeNids}
      tabTitleUpdateCounter={tabTitleUpdateCounter}
    />
  )
}
