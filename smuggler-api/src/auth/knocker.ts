import { smuggler, SmugglerError } from './../api'
import { StatusCode } from './../status_codes'

import type { Optional } from 'armoury'
import { log } from 'armoury'
import lodash from 'lodash'

export class Knocker {
  _scheduledId: Optional<number>
  _abortCallback?: () => void
  _abortController: AbortController
  _knockingPeriod: number

  constructor(knockingPeriod?: number, abortCallback?: () => void) {
    this._scheduledId = null
    this._abortCallback = abortCallback
    this._abortController = new AbortController()
    if (knockingPeriod) {
      this._knockingPeriod = knockingPeriod
    } else {
      // Randomly select something between 20min-40min
      this._knockingPeriod = lodash.random(1200000, 2400000)
    }
  }

  start() {
    if (this._scheduledId) {
      clearTimeout(this._scheduledId)
    }
    this._scheduledId = lodash.delay(this._doKnocKnock, this._knockingPeriod)
  }

  abort() {
    const { _abortCallback, _abortController, _scheduledId } = this
    if (_scheduledId) {
      clearTimeout(_scheduledId)
    }
    _abortController.abort()
    if (_abortCallback) {
      _abortCallback()
    }
  }

  _doKnocKnock = async () => {
    try {
      log.debug('Knock knock')
      await smuggler.session.update(this._abortController.signal)
    } catch (error) {
      const smugglerError = SmugglerError.fromAny(error)
      if (smugglerError?.status != null) {
        const code = smugglerError?.status
        if (
          code >= StatusCode.BAD_REQUEST &&
          // 500 is not included on purpose, most of the network errors are
          // marked with 500
          code < StatusCode.INTERNAL_SERVER_ERROR
        ) {
          log.debug('Failed to renew access token, log out')
          // Log out immediately if there is a client error
          this.abort()
        }
      }
      // Just retry in all other cases, e.g. temporary offline mode should not
      // resutl in log out.
    }
    this.start() // Restart the loop
  }
}
