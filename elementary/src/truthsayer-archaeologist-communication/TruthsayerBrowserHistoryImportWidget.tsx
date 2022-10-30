import React from 'react'
import styled from '@emotion/styled'
import { base64 } from 'armoury'

const Box = styled.div``

/**
 * Namespace that includes all the tools needed by truthsayer to tell
 * archaeologist at which position to inject @see BrowserHistoryImportControl
 * augmentation and how to configure it.
 */
export namespace TruthsayerBrowserHistoryImportWidget {
  /**
   * Datapoints that are required to set up @see BrowserHistoryImportControl
   * and so truthsayer has to transport them to archaeologist
   */
  export type Config = {
    /** @see BrowserHistoryUploadMode for more info on what each mode means */
    modes: ('untracked' | 'resumable')[]
  }

  const kClassNamePrefix = `mazed-truthsayer-archaeologist-`

  function encodeConfig(config: Config): string {
    return `${kClassNamePrefix}${base64.encode(JSON.stringify(config))}`
  }

  export function decodeConfig(className: string): Config {
    const startIndex = className.indexOf(kClassNamePrefix)
    if (startIndex === -1) {
      throw new Error(
        'Failed to decode thruthsayer browser history import props, ' +
          `encoded className is expected to start with ${kClassNamePrefix}` +
          `, full string = "${className}"`
      )
    }

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

  /** HTML element ID that archaeologist can search for in truthsayer's DOM
   * to find @see Beacon
   */
  export const kBeaconId =
    'mazed-truthsayer-archaeologist-browser-history-import-widget'

  /** When present in truthsayer's DOM, a beacon signals to archaeologist that
   * it should inject an augmentation with certain config at a certain DOM position.
   */
  export function Beacon(props: Config) {
    return <Box id={kBeaconId} className={encodeConfig(props)} />
  }
}
