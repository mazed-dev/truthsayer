/**
 * Implements message-based communication between truthsayer and archaeologist's
 * background script based on https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/externally_connectable
 * @see FromContent or @see FromPopUp for conceptually similar, but archaeologist-only
 * communication. This module's structure aims to mimic their code structure.
 *
 * Via this channel truthsayer can send requests to archaeologist, and responses
 * can be sent back, but archaeologist can't initiate requests itself (although
 * @see ToContent can be a substitute for the latter).
 */

import type {
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
} from '../storage_api_msg_proxy'

export namespace FromTruthsayer {
  export type StorageAccessRequest = {
    type: 'MSG_PROXY_STORAGE_ACCESS_REQUEST'
    payload: StorageApiMsgPayload
  }
  export type Request = StorageAccessRequest

  export function sendMessage(
    message: StorageAccessRequest
  ): Promise<ToTruthsayer.StorageAccessResponse>
  export function sendMessage(
    message: Request
  ): Promise<ToTruthsayer.Response> {
    // TODO[snikitin@outlook.com] Below implementation doesn't work on Firefox
    // at the time of this writing.
    // See https://stackoverflow.com/questions/10526995/can-a-site-invoke-a-browser-extension/10527809#10527809
    // for a workaround to make Firefox work (the second part of the answer)

    const extensionId =
      process.env.NODE_ENV === 'production'
        ? // For Chrome an extension ID can be extracted from extension store URL, such as
          // https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc
          'hkfjmbjendcoblcoackpapfphijagddc'
        : // TODO[snikitin@outlook.com] Check if the same ID get assigned for
          // local builds on different developer machines
          'aigmnioiceepjndkcojcalpoljcpdppm'
    const options: chrome.runtime.MessageOptions = {}

    return new Promise<any>((resolve, reject) => {
      if (chrome.runtime.sendMessage === undefined) {
        // See https://groups.google.com/a/chromium.org/g/chromium-extensions/c/tCWVZRq77cg/m/KB6-tvCdAgAJ
        // for more details on why 'sendMessage' may be undefined in Chromium
        reject(
          `Failed to send a ${message.type} message to archaeologist: no extension is listening, possibly extension not installed`
        )
        return
      }
      // See https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage
      // for complete set of rules on how this callback gets invoked
      const sendResponse = (response?: ToTruthsayer.Response) => {
        if (response === undefined) {
          reject(
            chrome.runtime.lastError?.message ??
              `Failed to send a ${message.type} message to archaeologist, but lastError wasn't set`
          )
          return
        }
        resolve(response)
      }
      chrome.runtime.sendMessage(extensionId, message, options, sendResponse)
    })
  }
}

export namespace ToTruthsayer {
  export type StorageAccessResponse = {
    type: 'MSG_PROXY_STORAGE_ACCESS_RESPONSE'
    value: StorageApiMsgReturnValue
  }
  export type Response = StorageAccessResponse
}
