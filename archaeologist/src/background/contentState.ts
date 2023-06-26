import { AccountInterface, NodeUtil, StorageApi } from 'smuggler-api'
import type { ContentAppOperationMode } from '../message/types'
import { ToContent, ContentAugmentationSettings } from '../message/types'
import { requestPageSavedStatus } from './pageStatus'
import { log, Timer } from 'armoury'
import type { AppSettings } from 'truthsayer-archaeologist-communication'

/** Calculates how the content script of a specific tab should be initialised. */
export async function calculateInitialContentState(
  storage: StorageApi,
  account: AccountInterface | undefined,
  tabUrl: string,
  mode: ContentAppOperationMode,
  appSettings: AppSettings
): Promise<ToContent.InitContentAugmentationRequest> {
  const { bookmark, fromNodes, toNodes } = await requestPageSavedStatus(
    storage,
    tabUrl
  )
  return {
    type: 'INIT_CONTENT_AUGMENTATION_REQUEST',
    nodeEnv: process.env.NODE_ENV,
    userUid: account?.getUid(),
    bookmark: bookmark ? NodeUtil.toJson(bookmark) : undefined,
    fromNodes: fromNodes?.map((node) => NodeUtil.toJson(node)) ?? [],
    toNodes: toNodes?.map((node) => NodeUtil.toJson(node)) ?? [],
    mode,
    appSettings,
  }
}

const contentAugmentationSettings: ContentAugmentationSettings = {}

export function updateAugmentationSettings(
  settings: ContentAugmentationSettings
): ContentAugmentationSettings {
  contentAugmentationSettings.productUpdate =
    settings.productUpdate ?? contentAugmentationSettings.productUpdate
  return contentAugmentationSettings
}
export function getAugmentationSettings(): ContentAugmentationSettings {
  return contentAugmentationSettings
}

export function register() {
  const timer = new Timer()
  log.debug('ContentState module is loaded', timer.elapsedSecondsPretty())
  return () => {}
}
