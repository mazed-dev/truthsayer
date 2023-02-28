import { Tabs } from 'webextension-polyfill'

/** Utilities to watch the status of a loading tab. */
export namespace TabLoad {
  type Monitors = {
    [key: number /* browser.Tabs.Tab.id */]: {
      onComplete: (tab: Tabs.Tab) => void
      onAbort: (reason: string) => void
    }
  }

  let state:
    | {
        phase: 'not-registered'
      }
    | {
        phase: 'registered'
        defaultOnComplete: (tab: Tabs.Tab) => Promise<void>
        monitors: Monitors
        takeOvers: Monitors
      } = { phase: 'not-registered' }

  /**
   * @summary Initialises the module.
   * @return Functor which, once invoked, de-inits the module.
   */
  export function register(
    defaultOnComplete: (tab: Tabs.Tab) => Promise<void>
  ): () => void {
    if (state.phase === 'registered') {
      throw new Error(`Attempted to register TabLoad more than once`)
    }

    state = {
      phase: 'registered',
      defaultOnComplete,
      monitors: {},
      takeOvers: {},
    }
    return () => {
      if (state.phase !== 'registered') {
        throw new Error(
          `Attempted to unregister TabLoad that hasn't been registerd`
        )
      }
      const abortReason = 'TabLoad module has been deregisterd'
      for (const key in state.takeOvers) {
        state.takeOvers[key].onAbort(abortReason)
      }
      for (const key in state.monitors) {
        state.monitors[key].onAbort(abortReason)
      }
      state = { phase: 'not-registered' }
    }
  }

  /**
   * Returns a Promise that will be resolved as soon as the tab is loaded completely
   * (according to @see report() ).
   * Will not interfere with the default way web pages get loaded (as opposed to
   * @see customise() )
   */
  export function monitor(tabId: number): Promise<Tabs.Tab> {
    return new Promise<Tabs.Tab>((resolve, reject) => {
      if (state.phase !== 'registered') {
        reject(`TabLoad hasn't been registered yet`)
        return
      }

      if (state.monitors[tabId] != null) {
        reject(
          `Tab ${tabId} is already monitored for completion by someone else`
        )
        return
      }
      if (state.takeOvers[tabId] != null) {
        reject(
          `Tab ${tabId} init has been taken over by someone else and it's ` +
            `load completion can't be monitored`
        )
        return
      }
      state.monitors[tabId] = { onComplete: resolve, onAbort: reject }
    })
  }

  /**
   * Returns a Promise that will be resolved as soon as the is loaded completely
   * (according to @see report() ).
   * Will skip the action executed on completion by default (in contrast to @see monitor() ),
   * allowing the caller to "customise" or "take over" what should happen with
   * the tab once it loads.
   */
  export function customise(tabId: number): Promise<Tabs.Tab> {
    return new Promise<Tabs.Tab>((resolve, reject) => {
      if (state.phase !== 'registered') {
        reject(`TabLoad hasn't been registered yet`)
        return
      }

      if (state.takeOvers[tabId] != null) {
        reject(`Tab ${tabId} init has already been taken over by someone else`)
        return
      }
      if (state.monitors[tabId] != null) {
        reject(
          `Tab ${tabId} init can't be taken over because someone else is already ` +
            `monitoring its load completion`
        )
        return
      }

      state.takeOvers[tabId] = { onComplete: resolve, onAbort: reject }
    })
  }
  /**
   * Report that a tab with given ID has been completely loaded
   * (expected to be called based on @see browser.Tabs.OnUpdatedChangeInfoType )
   */
  export async function report(tab: Tabs.Tab) {
    if (state.phase !== 'registered') {
      throw new Error(`TabLoad hasn't been registered yet`)
    }

    if (tab.id == null) {
      throw new Error(
        `Attempted to report load completion of a tab without an ID: ${JSON.stringify(
          tab
        )}`
      )
    }

    let parsedUrl: URL | null = null
    try {
      parsedUrl = new URL(tab.url ?? 'null')
    } catch {
      const msg = `Failed to parse ${tab.url} as a URL of tab ${tab.id}`
      abort(tab.id, msg)
      throw new Error(msg)
    }

    try {
      await simulateWaitForDynamicInit(parsedUrl)
      const onComplete =
        state.takeOvers[tab.id] == null
          ? state.defaultOnComplete
          : state.takeOvers[tab.id].onComplete
      await onComplete(tab)
    } finally {
      delete state.takeOvers[tab.id]
    }

    if (state.monitors[tab.id] != null) {
      try {
        state.monitors[tab.id].onComplete(tab)
      } finally {
        delete state.monitors[tab.id]
      }
    }
  }
  export function abort(tabId: number, reason: string) {
    if (state.phase !== 'registered') {
      throw new Error(`TabLoad hasn't been registered yet`)
    }

    if (state.monitors[tabId] != null) {
      try {
        state.monitors[tabId].onAbort(reason)
      } finally {
        delete state.monitors[tabId]
      }
    } else if (state.takeOvers[tabId] != null) {
      try {
        state.takeOvers[tabId].onAbort(reason)
      } finally {
        delete state.takeOvers[tabId]
      }
    }
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function simulateWaitForDynamicInit(url: URL) {
    // TODO[snikitin@outlook.com] Dynamic pages like GMail or Twitter
    // have less deterministic loading process (e.g. they emit multiple
    //    `browser.Tabs.OnUpdatedChangeInfoType.status === 'complete'`
    // events). A sleep is used to as cheap, but unreliable solution to this
    // observability problem.
    // Some directions that may make this deterministic:
    //    1. try to make 'content' script observe the state of each page via
    //       tools like MutationObserver. Seems like that'll require us to
    //       reverse-engineer how each "important" page behaves and then to
    //       hand-write a set of bespoke observer conditions.
    //       I tried this and couldn't make it work in short amount of time.
    //    2. at the time of this writing TabLoad waits for a single
    //       call to TabLoad.report() on `status === "complete"` event.
    //       It can be extended to wait for a configurable amount of events.
    //       That'll require us to again reverse-engineer the behaviour of
    //       "important" pages, but looking into the background events a page
    //       emits is much easier then reverse-engineering what happens in
    //       DOM from content script.
    //       I tried this and it is doable, but turned out too complex on the
    //       first try due to:
    //          - the problem of redirects (difficult to determine the correct
    //            set of events to use until redirects settle)
    //          - difficulties to marry this with other flows that call initMazedPartsOfTab()
    switch (url.host) {
      case 'mail.google.com':
      case 'twitter.com': {
        await sleep(2000)
        break
      }
    }
  }
}
