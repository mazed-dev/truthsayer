import * as webNavigation from './web-navigation/webNavigation'
import * as browserBookmarks from './browser-bookmarks/bookmarks'
import { PostHog } from 'posthog-js'
import {
  ToPopUp,
  ToContent,
  FromPopUp,
  FromContent,
  ToBackground,
  FromBackground,
} from './message/types'
import { TDoc } from 'elementary'
import * as badge from './badge/badge'

import browser, { Tabs } from 'webextension-polyfill'
import {
  AppSettings,
  BackgroundAction,
  BackgroundActionProgress,
  FromTruthsayer,
  ToTruthsayer,
} from 'truthsayer-archaeologist-communication'
import { log, isAbortError, unixtime, errorise } from 'armoury'
import {
  Nid,
  TNodeJson,
  NodeUtil,
  TotalUserActivity,
  NodeCreatedVia,
  StorageApi,
  makeDatacenterStorageApi,
  processMsgFromMsgProxyStorageApi,
  UserAccount,
} from 'smuggler-api'

import { makeBrowserExtStorageApi } from './storage_api_browser_ext'
import { isReadyToBeAutoSaved } from './background/pageAutoSaving'
import { getAppSettings, setAppSettings } from './appSettings'
import { TabLoad } from './tabLoad'
import { BrowserHistoryUpload } from './background/external-import/browserHistory'
import { requestPageSavedStatus } from './background/pageStatus'
import { saveWebPage, savePageQuote } from './background/savePage'
import { backgroundpa } from './background/productanalytics'
import { OpenTabs } from './background/external-import/openTabs'
import * as contentState from './background/contentState'
import * as similarity from './background/search/similarity'
import * as auth from './background/auth'

const BADGE_MARKER_PAGE_SAVED = '✓'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getActiveTab(): Promise<browser.Tabs.Tab | null> {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    const tab = tabs.find((tab) => {
      return tab.id && tab.url && tab.active
    })
    return tab || null
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
  return null
}

async function registerAttentionTime(
  storage: StorageApi,
  tab: browser.Tabs.Tab | null,
  message: FromContent.AttentionTimeChunk
): Promise<void> {
  if (tab?.id == null) {
    log.debug("Can't register attention time for a tab: ", tab?.url)
    return
  }
  const { totalSecondsEstimation, deltaSeconds, origin } = message
  let total: TotalUserActivity
  try {
    total = await storage.activity.external.add({
      origin: { id: origin.id },
      activity: {
        attention: {
          seconds: deltaSeconds,
          timestamp: unixtime.now(),
        },
      },
    })
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err, 'Could not register external activity')
    }
    return
  }
  log.debug(
    `Origin ${origin.id}, registered attention time: ` +
      `+${deltaSeconds} sec (total = ${total.seconds_of_attention}, full read = ${totalSecondsEstimation})`
  )
  if (isReadyToBeAutoSaved(total, totalSecondsEstimation)) {
    const response:
      | FromContent.SavePageResponse
      | FromContent.PageAlreadySavedResponse
      | FromContent.PageNotWorthSavingResponse = await ToContent.sendMessage(
      tab.id,
      { type: 'REQUEST_PAGE_CONTENT', manualAction: false }
    )
    if (response.type !== 'PAGE_TO_SAVE') {
      return
    }
    const createdVia: NodeCreatedVia = { autoAttentionTracking: null }
    await saveWebPage(storage, response, createdVia, tab.id)
  }
}

async function lookupForSuggestionsToPageInActiveTab(
  storage: StorageApi,
  tabId: number
): Promise<TNodeJson[]> {
  // Request page content first
  const response:
    | FromContent.SavePageResponse
    | FromContent.PageAlreadySavedResponse
    | FromContent.PageNotWorthSavingResponse = await ToContent.sendMessage(
    tabId,
    { type: 'REQUEST_PAGE_CONTENT', manualAction: true }
  )
  let textToSearchFor: string | null = null
  const excludedNids: Set<Nid> = new Set()
  if (response.type === 'PAGE_TO_SAVE' && response.content != null) {
    const { title, author, description, text } = response.content
    const desc = description ?? text
    textToSearchFor = [title, author.join(', '), desc ?? ''].join('.\n')
  } else if (response.type === 'PAGE_ALREADY_SAVED') {
    for (const nid of [
      response.bookmark.nid,
      ...response.fromNodes.map((n) => n.nid),
      ...response.toNodes.map((n) => n.nid),
    ]) {
      excludedNids.add(nid)
    }
    const node = NodeUtil.fromJson(response.bookmark)
    const title = node.extattrs?.title
    const description = node.extattrs?.description
    const author = node.extattrs?.author
    const coment = TDoc.fromNodeTextData(node.text).genPlainText()
    const desc = description ?? node.index_text?.plaintext ?? ''
    textToSearchFor = [title ?? '', desc, author ?? '', coment].join('.\n')
  }
  if (textToSearchFor != null && textToSearchFor.length >= 32) {
    const nodes = await similarity.findRelevantNodes(
      textToSearchFor,
      storage,
      8,
      excludedNids
    )
    return nodes.map(({ node }) => NodeUtil.toJson(node))
  }
  return []
}

async function handleMessageFromContent(
  ctx: BackgroundContext,
  message: FromContent.Request,
  sender: browser.Runtime.MessageSender
): Promise<ToContent.Response> {
  const tab = sender.tab ?? (await getActiveTab())
  log.debug('Get message from content', message, tab)
  switch (message.type) {
    case 'ATTENTION_TIME_CHUNK':
      await registerAttentionTime(ctx.storage, tab, message)
      return { type: 'VOID_RESPONSE' }
    case 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS': {
      const relevantNodes = await similarity.findRelevantNodes(
        message.phrase,
        ctx.storage,
        message.limit,
        new Set(message.excludeNids)
      )
      return {
        type: 'SUGGESTED_CONTENT_ASSOCIATIONS',
        suggested: relevantNodes.map(({ node }) => NodeUtil.toJson(node)),
      }
    }
    case 'REQUEST_CONTENT_AUGMENTATION_SETTINGS': {
      if (message.settings != null) {
        contentState.updateAugmentationSettings(message.settings)
      }
      return {
        type: 'RESPONSE_CONTENT_AUGMENTATION_SETTINGS',
        state: contentState.getAugmentationSettings(),
      }
    }
    case 'MSG_PROXY_STORAGE_ACCESS_REQUEST': {
      return {
        type: 'MSG_PROXY_STORAGE_ACCESS_RESPONSE',
        value: await processMsgFromMsgProxyStorageApi(
          ctx.storage,
          message.payload
        ),
      }
    }
  }
  throw new Error(
    `background received msg from content of unknown type, message: ${JSON.stringify(
      message
    )}`
  )
}

async function reportBackgroundActionProgress(
  action: BackgroundAction,
  progress: BackgroundActionProgress
) {
  // The implementation of this function mustn't throw
  // due to the expectations with which it gets used later
  try {
    const tab: browser.Tabs.Tab | null = await getActiveTab()
    const tabId = tab?.id
    if (tabId == null) {
      return
    }
    await ToContent.sendMessage(tabId, {
      type: 'REPORT_BACKGROUND_OPERATION_PROGRESS',
      operation: action,
      newState: progress,
    })
  } catch (err) {
    log.debug(`Failed to report ${action} progress, ${errorise(err).message}`)
  }
}

async function handleMessageFromPopup(
  ctx: BackgroundContext,
  message: FromPopUp.Request
): Promise<ToPopUp.Response> {
  // process is not defined in browsers extensions - use it to set up axios
  const activeTab = await getActiveTab()
  log.debug('Get message from popup', message, activeTab)
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      const tabId = activeTab?.id
      if (tabId == null) {
        return { type: 'PAGE_SAVED' }
      }
      const response:
        | FromContent.SavePageResponse
        | FromContent.PageAlreadySavedResponse
        | FromContent.PageNotWorthSavingResponse = await ToContent.sendMessage(
        tabId,
        { type: 'REQUEST_PAGE_CONTENT', manualAction: true }
      )
      if (response.type !== 'PAGE_TO_SAVE') {
        return { type: 'PAGE_SAVED' }
      }
      const createdVia: NodeCreatedVia = { manualAction: null }
      const { node, unmemorable } = await saveWebPage(
        ctx.storage,
        response,
        createdVia,
        tabId
      )
      return {
        type: 'PAGE_SAVED',
        bookmark: node ? NodeUtil.toJson(node) : undefined,
        unmemorable,
      }
    case 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS': {
      const { bookmark, unmemorable, fromNodes, toNodes } =
        await requestPageSavedStatus(ctx.storage, activeTab?.url)
      await badge.setStatus(
        activeTab?.id,
        bookmark != null ? BADGE_MARKER_PAGE_SAVED : undefined
      )
      return {
        type: 'UPDATE_POPUP_CARDS',
        mode: 'reset',
        bookmark: bookmark ? NodeUtil.toJson(bookmark) : undefined,
        fromNodes: fromNodes?.map((node) => NodeUtil.toJson(node)) ?? [],
        toNodes: toNodes?.map((node) => NodeUtil.toJson(node)) ?? [],
        unmemorable,
      }
    }
    case 'REQUEST_APP_STATUS': {
      // TODO[snikitin@outlook.com] This is copy-pasted in onAuthenticationMessage,
      // should somehow be consolidated
      const account = auth.account()
      const authenticated = account.isAuthenticated()
      badge.setActive(authenticated)
      return {
        type: 'APP_STATUS_RESPONSE',
        userUid: authenticated ? account.getUid() : undefined,
        analyticsIdentity: await backgroundpa.getIdentity(
          browser.storage.local
        ),
      }
    }
    case 'REQUEST_TO_LOG_IN': {
      throw new Error(`Authentication has already been successfully completed`)
    }
    case 'REQUEST_SUGGESTIONS_TO_PAGE_IN_ACTIVE_TAB': {
      const suggestedAkinNodes: TNodeJson[] = []
      const tabId = activeTab?.id
      if (tabId != null) {
        suggestedAkinNodes.push(
          ...(await lookupForSuggestionsToPageInActiveTab(ctx.storage, tabId))
        )
      }
      return {
        type: 'RESPONSE_SUGGESTIONS_TO_PAGE_IN_ACTIVE_TAB',
        suggestedAkinNodes,
      }
    }
    case 'MSG_PROXY_STORAGE_ACCESS_REQUEST': {
      return {
        type: 'MSG_PROXY_STORAGE_ACCESS_RESPONSE',
        value: await processMsgFromMsgProxyStorageApi(
          ctx.storage,
          message.payload
        ),
      }
    }
    case 'REQUEST_UPDATE_NODE': {
      const { args } = message
      await ctx.storage.node.update(args)
      return { type: 'VOID_RESPONSE' }
    }
  }
  throw new Error(
    `background received msg from popup of unknown type, message: ${JSON.stringify(
      message
    )}`
  )
}

function makeStorageApi(
  appSettings: AppSettings,
  account: UserAccount
): StorageApi {
  switch (appSettings.storageType) {
    case 'datacenter':
      return makeDatacenterStorageApi()
    case 'browser_ext':
      return makeBrowserExtStorageApi(browser.storage.local, account)
  }
}

type BackgroundContext = {
  storage: StorageApi
  analytics: PostHog | null
}

/**
 * Intended to be responsible for actions similar to what a main()
 * function might do in other environments, like
 *  - execution and sequencing of initialisation
 *  - wiring different business logic components together
 *  - etc
 */
class Background {
  state:
    | { phase: 'not-init' }
    | { phase: 'loading' }
    | { phase: 'unloading' }
    | { phase: 'init-done'; context: BackgroundContext } = { phase: 'not-init' }

  private deinitialisers: (() => void | Promise<void>)[] = []

  constructor() {
    log.debug(`Background one-time pre-init started`)
    auth.observe({
      onLogin: async (account: UserAccount) => {
        if (this.state.phase !== 'not-init') {
          throw new Error(
            `Attempted to init background, but it has unexpected state '${this.state.phase}'`
          )
        }
        this.state = { phase: 'loading' }
        try {
          log.debug(`Background init started`)
          const context = await this.init(account)
          this.state = { phase: 'init-done', context }
          log.debug(`Background init done`)
        } catch (initFailureReason) {
          try {
            await this.deinit()
            log.error(
              `Background init failed: ${errorise(initFailureReason).message}`
            )
          } catch (deinitFailureReason) {
            log.error(
              `Background init failed: ${
                errorise(initFailureReason).message
              }\n` +
                `Also failed to revert the partially complete init: ${
                  errorise(deinitFailureReason).message
                }`
            )
          }
          this.state = { phase: 'not-init' }
          throw initFailureReason
        }
      },
      onLogout: async () => {
        if (
          this.state.phase === 'not-init' ||
          this.state.phase === 'unloading'
        ) {
          log.debug(
            `Attempted to deinit background, but its state is already '${this.state.phase}'`
          )
          return
        }

        log.debug(`Background deinit started`)
        this.state = { phase: 'unloading' }
        await this.deinit()
        this.state = { phase: 'not-init' }
        log.debug(`Background deinit ended`)
      },
    })
    auth.register()
    log.debug(`Background one-time pre-init ended`)
  }

  private async init(account: UserAccount): Promise<BackgroundContext> {
    const analyticsIdentity = await backgroundpa.getIdentity(
      browser.storage.local
    )
    // Product analytics should be initialised ASAP because
    // other initialisation stages may require access to feature flags
    const analytics = await backgroundpa.make(analyticsIdentity)

    const storage = makeStorageApi(
      await getAppSettings(browser.storage.local),
      account
    )

    const ctx: BackgroundContext = { storage, analytics }

    // Init content once tab is fully loaded
    {
      const onComplete = async (tab: Tabs.Tab) => {
        if (tab.incognito || tab.hidden || !tab.url || tab.id == null) {
          return
        }
        const request = await contentState.calculateInitialContentState(
          ctx.storage,
          tab.url,
          { type: 'active-mode-content-app', analyticsIdentity }
        )
        await ToContent.sendMessage(tab.id, request)
        badge.setStatus(
          tab.id,
          request.bookmark != null ? BADGE_MARKER_PAGE_SAVED : undefined
        )
      }
      this.deinitialisers.push(TabLoad.register(onComplete))
    }
    // Listen for tab updates
    {
      // NOTE: on more complex web-pages onUpdated may be invoked multiple times
      // with exactly the same input parameters. So the handling code has to
      // be able to handle that.
      // See https://stackoverflow.com/a/18302254/3375765 for more information.
      const onTabUpdate = async (
        _tabId: number,
        changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
        tab: browser.Tabs.Tab
      ) => {
        try {
        } finally {
          if (changeInfo.status === 'complete') {
            // NOTE: if loading of a tab did complete, it is important to ensure
            // report() gets called regardless of what happens in the other parts of
            // browser.tabs.onUpdated (e.g. something throws). Otherwise any part of
            // code that waits on a TabLoad promise will wait forever.
            TabLoad.report(tab)
          }
        }
      }

      browser.tabs.onUpdated.addListener(onTabUpdate)
      this.deinitialisers.push(() =>
        browser.tabs.onUpdated.removeListener(onTabUpdate)
      )
    }

    // Listen to removal of tabs
    {
      const onTabRemoval = async (
        tabId: number,
        _removeInfo: browser.Tabs.OnRemovedRemoveInfoType
      ) => {
        TabLoad.abort(tabId, 'Tab removed')
      }
      browser.tabs.onRemoved.addListener(onTabRemoval)
      this.deinitialisers.push(() =>
        browser.tabs.onRemoved.removeListener(onTabRemoval)
      )
    }

    // Add custom context menus
    {
      const kMazedContextMenuItemId = 'selection-to-mazed-context-menu-item'
      browser.contextMenus.removeAll()
      browser.contextMenus.create({
        title: 'Save to Mazed',
        type: 'normal',
        id: kMazedContextMenuItemId,
        contexts: ['selection', 'editable'],
      })
      this.deinitialisers.push(() => browser.contextMenus.removeAll())

      const onContextMenuClick = async (
        info: browser.Menus.OnClickData,
        tab: browser.Tabs.Tab | undefined
      ) => {
        if (info.menuItemId === kMazedContextMenuItemId) {
          if (tab?.id == null) {
            return
          }
          const { selectionText } = info
          if (selectionText == null) {
            return
          }
          try {
            const response: FromContent.GetSelectedQuoteResponse =
              await ToContent.sendMessage(tab.id, {
                type: 'REQUEST_SELECTED_WEB_QUOTE',
                text: selectionText,
              })
            const { url, text, path, lang, fromNid } = response
            const createdVia: NodeCreatedVia = { manualAction: null }
            await savePageQuote(
              ctx.storage,
              { url, path, text },
              createdVia,
              lang,
              tab?.id,
              fromNid
            )
          } catch (err) {
            if (!isAbortError(err)) {
              log.exception(err)
            }
          }
        }
      }

      browser.contextMenus.onClicked.addListener(onContextMenuClick)
      this.deinitialisers.push(() =>
        browser.contextMenus.onClicked.removeListener(onContextMenuClick)
      )
    }

    this.deinitialisers.push(browserBookmarks.register(ctx.storage))
    this.deinitialisers.push(webNavigation.register(ctx.storage))
    this.deinitialisers.push(await similarity.register(ctx.storage))
    this.deinitialisers.push(contentState.register())

    return ctx
  }

  private async deinit(): Promise<void> {
    for (let index = this.deinitialisers.length - 1; index >= 0; index--) {
      const deinitialiser = this.deinitialisers[index]
      try {
        await deinitialiser()
      } catch (reason) {
        log.warning(
          `During background init: deinitialiser #${index} threw an error. ` +
            `Deinit will proceed regardless. Error: ${
              errorise(reason).message
            }; `
        )
      }
    }
    this.deinitialisers = []
  }

  async onMessageFromOtherPartsOfArchaeologist(
    message: ToBackground.Request,
    sender: browser.Runtime.MessageSender
  ): Promise<FromBackground.Response> {
    if (this.state.phase === 'not-init') {
      return await this.handleAuthenticationMessageFromPopup(message)
    }
    if (this.state.phase !== 'init-done') {
      throw new Error(`background unexpectedly had state '${this.state.phase}'`)
    }

    const ctx = this.state.context
    switch (message.direction) {
      case 'from-content':
        return await handleMessageFromContent(ctx, message, sender)
      case 'from-popup':
        return await handleMessageFromPopup(ctx, message)
    }
    throw new Error(
      `background received msg of unknown direction, message: ${JSON.stringify(
        message
      )}`
    )
  }

  async handleAuthenticationMessageFromPopup(
    message: ToBackground.Request
  ): Promise<FromBackground.Response> {
    const error =
      "until authentication is successful, only 'from-popup' messages related to authentication are allowed"
    if (message.direction !== 'from-popup') {
      throw new Error(error)
    }

    switch (message.type) {
      case 'REQUEST_APP_STATUS': {
        // TODO[snikitin@outlook.com] This is copy-pasted in handleMessageFromPopup,
        // should somehow be consolidated
        const account = auth.account()
        const authenticated = account.isAuthenticated()
        badge.setActive(authenticated)
        return {
          type: 'APP_STATUS_RESPONSE',
          userUid: authenticated ? account.getUid() : undefined,
          analyticsIdentity: await backgroundpa.getIdentity(
            browser.storage.local
          ),
        }
      }
      case 'REQUEST_TO_LOG_IN': {
        const timeout = new Promise<never>((_, reject) => {
          sleep(5000).then(() =>
            reject(`Initialisation after successful login has timed out`)
          )
        })
        // The goal of the promise below is to wait until Background.init()
        // finishes fully. This means the sender of the request knows
        // deterministically when it's allowed to start sending requests
        // not related to authentication.
        //
        // HACK: Implementation of the above however is a hack -- it
        // piggy backs on the fact that
        //    - `auth.observe` executes callbacks in order of their registration
        //    - when `auth.observe` executes callbacks, it `await`s for a callback
        //      to finish before going to the next one
        //    - the very first callback registered with `auth.observe` is the
        //      one which calls `Background.init()`
        // in order of their registreation
        const waitForInit = new Promise<UserAccount>((resolve, reject) => {
          const stopObserving = auth.observe({
            onLogin: async (account: UserAccount) => {
              stopObserving()
              resolve(account)
            },
            onLogout: async () => {
              stopObserving()
              reject()
            },
          })
        })
        await auth.login(message.args)
        const account = await Promise.race([timeout, waitForInit])
        return {
          type: 'RESPONSE_LOG_IN',
          user: {
            email: account.getEmail(),
            uid: account.getUid(),
            name: account.getName(),
          },
        }
      }
    }
    throw new Error(error)
  }

  async onMessageFromTruthsayer(
    message: FromTruthsayer.Request,
    sender: browser.Runtime.MessageSender
  ): Promise<ToTruthsayer.Response> {
    if (message.type === 'CHECK_AUTHORISATION_STATUS_REQUEST') {
      await auth.check()
      return { type: 'VOID_RESPONSE' }
    }
    if (this.state.phase !== 'init-done') {
      throw new Error(`background unexpectedly had state '${this.state.phase}'`)
    }
    const ctx = this.state.context

    switch (message.type) {
      case 'GET_ARCHAEOLOGIST_STATE_REQUEST': {
        return {
          type: 'GET_ARCHAEOLOGIST_STATE_RESPONSE',
          version: {
            version: browser.runtime.getManifest().version,
          },
          analyticsIdentity: await backgroundpa.getIdentity(
            browser.storage.local
          ),
        }
      }
      case 'GET_APP_SETTINGS_REQUEST': {
        return {
          type: 'GET_APP_SETTINGS_RESPONSE',
          settings: await getAppSettings(browser.storage.local),
        }
      }
      case 'SET_APP_SETTINGS_REQUEST': {
        await setAppSettings(browser.storage.local, message.newValue)
        return {
          type: 'VOID_RESPONSE',
        }
      }
      case 'MSG_PROXY_STORAGE_ACCESS_REQUEST': {
        return {
          type: 'MSG_PROXY_STORAGE_ACCESS_RESPONSE',
          value: await processMsgFromMsgProxyStorageApi(
            ctx.storage,
            message.payload
          ),
        }
      }
      case 'UPLOAD_BROWSER_HISTORY': {
        await BrowserHistoryUpload.upload(
          ctx.storage,
          message,
          (progress: BackgroundActionProgress) =>
            reportBackgroundActionProgress('browser-history-upload', progress)
        )
        return { type: 'VOID_RESPONSE' }
      }
      case 'CANCEL_BROWSER_HISTORY_UPLOAD': {
        BrowserHistoryUpload.cancel()
        return { type: 'VOID_RESPONSE' }
      }
      case 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY': {
        const numDeleted = await ctx.storage.node.bulkDelete({
          createdVia: {
            autoIngestion: BrowserHistoryUpload.externalPipelineId(),
          },
        })
        return {
          type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY',
          numDeleted,
        }
      }
      case 'UPLOAD_CURRENTLY_OPEN_TABS_REQUEST': {
        await OpenTabs.uploadAll(
          ctx.storage,
          (progress: BackgroundActionProgress) =>
            reportBackgroundActionProgress('open-tabs-upload', progress)
        )
        return { type: 'VOID_RESPONSE' }
      }
      case 'CANCEL_UPLOAD_OF_CURRENTLY_OPEN_TABS_REQUEST': {
        OpenTabs.cancel()
        return { type: 'VOID_RESPONSE' }
      }
      case 'ACTIVATE_MY_TAB_REQUEST': {
        const tabId = sender.tab?.id
        if (tabId == null) {
          throw new Error(
            `background can not activate tab with no ID: ${JSON.stringify(
              sender
            )}`
          )
        }
        await browser.tabs.update(tabId, { active: true })
        if (message.reload) {
          await browser.tabs.reload(tabId)
        }
      }
    }
    throw new Error(
      `background received msg from truthsayer of unknown type, message: ${JSON.stringify(
        message
      )}`
    )
  }
}

const bg = new Background()

// NOTE: it is important that there is exactly one listener for browser.runtime.onMessage
// at all times (including the very first stages of background initialisation).
// This guarantees tha when other parts of archaeologist send messages, there
// is at least *some* response in every case (instad of difficult to
// diagnose "Could not establish connection. Receiving end does not exist." errors).
browser.runtime.onMessage.addListener(
  (message: ToBackground.Request, sender: browser.Runtime.MessageSender) => {
    try {
      return bg.onMessageFromOtherPartsOfArchaeologist(message, sender)
    } catch (reason) {
      log.error(
        `Failed to process '${message.direction}' message '${message.type}': ` +
          `${errorise(reason).message}`
      )
      throw reason
    }
  }
)
// NOTE: the same that's described above for browser.runtime.onMessage
// is true here as well. There must be exactly one listener for
// browser.runtime.onMessageExternal, as soon as possible.
browser.runtime.onMessageExternal.addListener(
  (message: FromTruthsayer.Request, sender: browser.Runtime.MessageSender) => {
    try {
      return bg.onMessageFromTruthsayer(message, sender)
    } catch (reason) {
      log.error(
        `Failed to process 'from-truthsayer' message '${message.type}', ` +
          `${errorise(reason).message}`
      )
      throw reason
    }
  }
)
