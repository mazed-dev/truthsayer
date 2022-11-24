import { smuggler, SmugglerError } from './../api'
import { StatusCode } from './../status_codes'
import { authCookie } from './cookie'

import { errorise, Optional } from 'armoury'
import { log, unixtime } from 'armoury'
import lodash from 'lodash'

export class Knocker {
  #scheduledId: Optional<number>
  readonly #abortCallback?: () => void
  readonly #abortController: AbortController
  readonly #knockingPeriodSeconds: number
  readonly #checkingPeriodMSeconds: number
  readonly getLastUpdate: typeof authCookie.lastUpdate.get
  readonly setLastUpdate: typeof authCookie.lastUpdate.set

  constructor(
    abortCallback?: () => void,
    getLastUpdate?: typeof authCookie.lastUpdate.get,
    setLastUpdate?: typeof authCookie.lastUpdate.set
  ) {
    this.getLastUpdate = getLastUpdate || authCookie.lastUpdate.get
    this.setLastUpdate = setLastUpdate || authCookie.lastUpdate.set
    this.#scheduledId = null
    this.#abortCallback = abortCallback
    this.#abortController = new AbortController()
    this.#knockingPeriodSeconds = lodash.random(2400, 3600)
    this.#checkingPeriodMSeconds = lodash.random(80_000, 120_000)
  }

  start = async ({
    onKnockSuccess,
    onKnockFailure,
  }: {
    onKnockSuccess?: () => Promise<void>
    onKnockFailure?: () => void
  }) => {
    if (this.#scheduledId) {
      clearTimeout(this.#scheduledId)
    }
    // Check if token has to be updated with [knock] every 2 minutes restart the
    // loop if everything is ok
    await this.knock(
      // Restart loop on check success
      () => {
        this.#scheduledId = lodash.delay(
          this.start,
          this.#checkingPeriodMSeconds,
          { onKnockSuccess, onKnockFailure }
        )
      },
      // Log out immediately if there is a client error
      () => {
        try {
          if (onKnockFailure != null) {
            onKnockFailure()
          }
        } catch (e) {
          log.warning(
            `Suppressed error during knock failure: ${errorise(e).message}`
          )
        } finally {
          this.abort()
        }
      },
      onKnockSuccess
    )
  }

  abort = async () => {
    log.debug('Knocker aborted')
    if (this.#scheduledId) {
      clearTimeout(this.#scheduledId)
    }
    this.#abortController.abort()
    if (this.#abortCallback) {
      this.#abortCallback()
    }
  }

  knock = async (
    onCheckSuccess: () => void,
    onKnockFailure: () => void,
    onKnockSuccess?: () => Promise<void>
  ): Promise<void> => {
    try {
      // To renew auth token more effectively rely on 'lastUpdate' value stored
      // to cookies for loose syncronisation across all open tabs of truthsayer
      // web app and archaeologist background script.
      const lastUpdateTime = (await this.getLastUpdate())?.time ?? 0
      const now = unixtime.now()
      if (this.#knockingPeriodSeconds < now - lastUpdateTime) {
        log.debug('Knock-knock smuggler', now, lastUpdateTime)
        await smuggler.session.update(this.#abortController.signal)
        this.setLastUpdate({ time: now })

        try {
          if (onKnockSuccess != null) {
            await onKnockSuccess()
          }
        } catch (e) {
          log.warning(
            `Suppressed error during knock success: ${errorise(e).message}`
          )
        }
      }
    } catch (error) {
      const smugglerError = SmugglerError.fromAny(error)
      if (smugglerError?.status != null) {
        const code = smugglerError?.status
        if (
          // Client errors at tocken renewal
          code >= StatusCode.BAD_REQUEST &&
          code < 499
        ) {
          log.debug('Failed to renew smuggler access token')
          onKnockFailure()
        }
      }
      // Just retry in all other cases, e.g. temporary offline mode should not
      // resutl in log out.
    }
    onCheckSuccess()
  }
}
