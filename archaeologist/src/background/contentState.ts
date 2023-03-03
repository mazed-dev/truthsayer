import { NodeUtil, StorageApi } from 'smuggler-api'
import browser from 'webextension-polyfill'
import type { ContentAppOperationMode } from '../message/types'
import { ToContent, ContentAugmentationSettings } from '../message/types'
import { requestPageSavedStatus } from './pageStatus'
import * as auth from './auth'

/** Calculates how the content script of a specific tab should be initialised. */
export async function calculateInitialContentState(
  storage: StorageApi,
  tab: browser.Tabs.Tab,
  mode: ContentAppOperationMode
): Promise<ToContent.InitContentAugmentationRequest> {
  if (tab.url == null) {
    throw new Error(`Can't calculate content state, input tab has no URL`)
  }

  const { bookmark, fromNodes, toNodes } = await requestPageSavedStatus(
    storage,
    tab.url
  )

  return {
    type: 'INIT_CONTENT_AUGMENTATION_REQUEST',
    nodeEnv: process.env.NODE_ENV,
    userUid: auth.account().getUid(),
    bookmark: bookmark ? NodeUtil.toJson(bookmark) : undefined,
    fromNodes: fromNodes?.map((node) => NodeUtil.toJson(node)) ?? [],
    toNodes: toNodes?.map((node) => NodeUtil.toJson(node)) ?? [],
    mode,
  }
}

const contentAugmentationSettings: ContentAugmentationSettings = {}

export function updateAugmentationSettings(
  settings: ContentAugmentationSettings
): ContentAugmentationSettings {
  contentAugmentationSettings.isRevealed =
    settings.isRevealed ?? contentAugmentationSettings.isRevealed
  contentAugmentationSettings.positionY =
    settings.positionY ?? contentAugmentationSettings.positionY
  return contentAugmentationSettings
}
export function getAugmentationSettings(): ContentAugmentationSettings {
  return contentAugmentationSettings
}

export function register() {
  return () => {}
}
