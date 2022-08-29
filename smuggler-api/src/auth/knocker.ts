import { smuggler, SmugglerError } from './../api'
import { StatusCode } from './../status_codes'
import { authCookie } from './cookie'

import type { Optional } from 'armoury'
import { log, unixtime } from 'armoury'
import lodash from 'lodash'

export class Knocker {
  _scheduledId: Optional<number>
  readonly _abortCallback?: () => void
  readonly _abortController: AbortController
  readonly _knockingPeriodSeconds: number
  readonly getLastUpdate: typeof authCookie.lastUpdate.get
  readonly setLastUpdate: typeof authCookie.lastUpdate.set

  constructor(
    knockingPeriodSeconds?: number,
    abortCallback?: () => void,
    getLastUpdate_?: typeof authCookie.lastUpdate.get,
    setLastUpdate_?: typeof authCookie.lastUpdate.set
  ) {
    this.getLastUpdate = getLastUpdate_ ?? authCookie.lastUpdate.get
    this.setLastUpdate = setLastUpdate_ ?? authCookie.lastUpdate.set
    this._scheduledId = null
    this._abortCallback = abortCallback
    this._abortController = new AbortController()
    this._knockingPeriodSeconds =
      knockingPeriodSeconds ?? lodash.random(2400, 3600)
  }

  start = async () => {
    if (this._scheduledId) {
      clearTimeout(this._scheduledId)
    }
    // Check if token has to be updated with [knock] every minute restart the
    // loop if everything is ok
    if (await this.knock()) {
      this._scheduledId = lodash.delay(this.start, 1_000)
    } else {
      // Log out immediately if there is a client error
      this.abort()
    }
  }

  abort = async () => {
    const { _abortCallback, _abortController, _scheduledId } = this
    if (_scheduledId) {
      clearTimeout(_scheduledId)
    }
    _abortController.abort()
    if (_abortCallback) {
      _abortCallback()
    }
  }

  knock = async (): Promise<boolean> => {
    try {
      // Rely on 'lastUpdate' value stored to cookies for loose syncronisation
      // across all open tabs with web app and archaeologist background script
      const lastUpdate = await this.getLastUpdate()
      const now = unixtime.now()
      log.debug(
        'Try to knock smuggler',
        this._knockingPeriodSeconds,
        now,
        lastUpdate?.time ?? 0
      )
      if (this._knockingPeriodSeconds < now - (lastUpdate?.time ?? 0)) {
        log.debug('Knock knock smuggler')
        await smuggler.session.update(this._abortController.signal)
        this.setLastUpdate({ time: now })
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
          return false
        }
      }
      // Just retry in all other cases, e.g. temporary offline mode should not
      // resutl in log out.
    }
    return true
  }
}
