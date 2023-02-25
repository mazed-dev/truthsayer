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
} from 'smuggler-api'
import { log, errorise } from 'armoury'

export type StorageType =
  | 'datacenter' /** Stores user data in @file storage_api_datacenter.ts */
  | 'browser_ext' /** Stores user data in @file storage_api_browser_ext.ts */

export type AppSettings = {
  storageType: StorageType
}

export function defaultSettings(): AppSettings {
  return { storageType: 'browser_ext' }
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const response = await FromTruthsayer.sendMessage({
      type: 'GET_APP_SETTINGS_REQUEST',
    })
    return response.settings
  } catch (err) {
    const defaults = defaultSettings()
    log.warning(
      `Failed to get user's app settings,` +
        ` falling back to ${JSON.stringify(defaults)}; ` +
        `error - ${errorise(err).message}`
    )
    return defaults
  }
}

export namespace FromTruthsayer {
  export type GetArchaeologistStateRequest = {
    type: 'GET_ARCHAEOLOGIST_STATE_REQUEST'
  }
  /**
   * Get/set settings that the user set up for Mazed
   */
  export type GetAppSettingsRequest = {
    type: 'GET_APP_SETTINGS_REQUEST'
  }
  export type SetAppSettingsRequest = {
    type: 'SET_APP_SETTINGS_REQUEST'
    newValue: AppSettings
  }
  /**
   * Request that makes @file storage_api_msg_proxy.ts work
   */
  export type StorageAccessRequest = {
    type: 'MSG_PROXY_STORAGE_ACCESS_REQUEST'
    payload: StorageApiMsgPayload
  }
  export type Request =
    | GetArchaeologistStateRequest
    | GetAppSettingsRequest
    | SetAppSettingsRequest
    | StorageAccessRequest

  export function sendMessage(
    message: GetArchaeologistStateRequest
  ): Promise<ToTruthsayer.GetArchaeologistStateResponse>
  export function sendMessage(
    message: GetAppSettingsRequest
  ): Promise<ToTruthsayer.GetAppSettingsResponse>
  export function sendMessage(
    message: SetAppSettingsRequest
  ): Promise<ToTruthsayer.VoidResponse>
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
          // Extension store ensures that it doesn't change between archaeologist
          // versions
          'hkfjmbjendcoblcoackpapfphijagddc'
        : // Archaeologist's manifest.json is expected to have modifications
          // that ensure the same ID gets assigned to the dev extension version
          // on every build
          'dnjclfepefgpljnecekakpimfjaikgfd'
    const options: chrome.runtime.MessageOptions = {}

    return new Promise<ToTruthsayer.Response>((resolve, reject) => {
      if (
        chrome.runtime === undefined ||
        chrome.runtime.sendMessage === undefined
      ) {
        // See https://groups.google.com/a/chromium.org/g/chromium-extensions/c/tCWVZRq77cg/m/KB6-tvCdAgAJ
        // for more details on why 'sendMessage' may be undefined in Chromium
        reject(
          `Failed to send a ${message.type} message to archaeologist: ` +
            `no extension with ID ${extensionId} is listening, possibly extension not installed`
        )
        return
      }
      // See https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage
      // for complete set of rules on how this callback gets invoked
      const sendResponse = (response: any) => {
        if (response === undefined) {
          reject(
            chrome.runtime.lastError?.message ??
              `Failed to send a ${message.type} message to archaeologist, but lastError wasn't set`
          )
          return
        }
        // See https://github.com/mozilla/webextension-polyfill/blob/9398f8cc20ed7e1cc2b475180ed1bc4dee2ebae5/src/browser-polyfill.js#L451-L454
        // This doesn't seem to be publicly document, but if a web page sends
        // a message to an extension which uses mozilla/webextension-polyfill and
        // extension throws during processing of the message then the response
        // will be an object with a special '__mozWebExtensionPolyfillReject__'
        // set to true
        else if (response.__mozWebExtensionPolyfillReject__ === true) {
          reject(response.message)
          return
        }
        resolve(response as ToTruthsayer.Response)
      }
      chrome.runtime.sendMessage(extensionId, message, options, sendResponse)
    })
  }
}

export namespace ToTruthsayer {
  export type ArchaeologistVersion = {
    version: string
    // uid: string
    // ...
  }

  export type VoidResponse = { type: 'VOID_RESPONSE' }
  export type GetArchaeologistStateResponse = {
    type: 'GET_ARCHAEOLOGIST_STATE_RESPONSE'
    version: ArchaeologistVersion
  }
  export type GetAppSettingsResponse = {
    type: 'GET_APP_SETTINGS_RESPONSE'
    settings: AppSettings
  }
  export type StorageAccessResponse = {
    type: 'MSG_PROXY_STORAGE_ACCESS_RESPONSE'
    value: StorageApiMsgReturnValue
  }
  export type Response =
    | VoidResponse
    | GetArchaeologistStateResponse
    | GetAppSettingsResponse
    | StorageAccessResponse
}
