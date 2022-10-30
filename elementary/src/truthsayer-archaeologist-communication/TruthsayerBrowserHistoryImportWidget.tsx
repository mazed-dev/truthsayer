import React from 'react'
import styled from '@emotion/styled'
import { base64 } from 'armoury'

const Box = styled.div``

/**
 * Namespace that includes all the tools
 *  - needed by truthsayer to tell archaeologist at which position to
 *    inject @see BrowserHistoryImportControl augmentation and how to configure it
 *  - needed by archaeologist to understand truthsayer's instructions
 */
export namespace BrowserHistoryImport {
  /**
   * Datapoints that are required to set up @see BrowserHistoryImportControl
   * and so truthsayer has to transport them to archaeologist
   */
  export type Config = {
    /** @see BrowserHistoryUploadMode for more info on what each mode means */
    modes: ('untracked' | 'resumable')[]
  }

  const kClassNamePrefix = `mazed-truthsayer-archaeologist-browser-history-import-`

  const kBeaconId =
    'mazed-truthsayer-archaeologist-browser-history-import-widget'

  /** Tools that should only be invoked by truthsayer */
  export namespace truthsayer {
    function encodeConfig(config: Config): string {
      return `${kClassNamePrefix}${base64.encode(JSON.stringify(config))}`
    }

    /** When present in truthsayer's DOM, a beacon signals to archaeologist that
     * it should inject an augmentation with certain config at a certain DOM position.
     */
    export function Beacon(config: Config) {
      return <Box id={kBeaconId} className={encodeConfig(config)} />
    }
  }

  /** Tools that should only be invoked from within archaeologist's content script */
  export namespace archaeologist {
    /**
     * @param beacon an HTML element rendered by truthsayer via @see Beacon
     */
    function extractConfigFrom(beacon: HTMLElement): Config {
      const className = beacon.className
      const startIndex = className.indexOf(kClassNamePrefix)
      if (startIndex === -1) {
        throw new Error(
          'Failed to decode browser history import config, is input a Beacon? ' +
            `className is expected to start with ${kClassNamePrefix}` +
            `, full className = "${className}"`
        )
      }

      // NOTE: className strings are space-separated and can include more
      // classes, concatanated to the className specified by @see encodeConfig.
      // This means that the encoded config string ends either with a space or with
      // an end of line.
      const endIndex = className.indexOf(
        ' ',
        startIndex + kClassNamePrefix.length
      )
      const encodedConfig = className.slice(
        startIndex + kClassNamePrefix.length,
        endIndex !== -1 ? endIndex : undefined
      )
      return JSON.parse(base64.decode(encodedConfig)) as Config
    }

    /** Find an HTML element rendered by @see Beacon, return it and its @see Config */
    export function findBeacon(
      doc: Document
    ): [HTMLElement | null, Config | null] {
      const beacon = doc.getElementById(kBeaconId)
      if (beacon == null) {
        return [null, null]
      }
      return [beacon, extractConfigFrom(beacon)]
    }
  }
}
