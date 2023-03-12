import { authentication, SmugglerError } from '../api_datacenter'
import { StatusCode } from './../status_codes'
import { authCookie } from './cookie'

import { log, unixtime, errorise } from 'armoury'
import type { Optional } from 'armoury'
import lodash from 'lodash'
/*
 * A Knocker object role is to renew auth token after successful login
 * periodically.
 *
 * - Knocker must be created on each successful login.
 * - Knocker is mindful of other Knocker objects working in all active
 *   Truthsayer tabs and in Archaeologist background script.
 * - Knocker role is to renew auth token after successful login periodically.
 * - Knocker stops after a first renewal failure.
 */
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

  isActive(): boolean {
    return this.#scheduledId !== null
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
      this.#scheduledId = null
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

  /**
   * Reverses the effect of @see start() with no side effects.
   * @see abort() for a version with side effects.
   */
  stop = () => {
    if (this.#scheduledId) {
      clearTimeout(this.#scheduledId)
      this.#scheduledId = null
    }
    this.#abortController.abort()
  }

  /**
   * Reverses the effect of @see start() & invokes the abort callback supplied
   * during construction.
   * @see stop() for a side effect-free version.
   */
  abort = async () => {
    this.stop()
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
        await authentication.session.update(this.#abortController.signal)
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
