import React from 'react'
import styled from '@emotion/styled'
import { base64 } from 'armoury'

export const kTruthsayerBrowserHistoryImportWidgetId =
  'mazed-truthsayer-archaeologist-browser-history-import-widget'

const Box = styled.div``

export type TruthsayerBrowserHistoryImportConfig = {
  modes: ('untracked' | 'resumable')[]
}

const kClassNamePrefix = `mazed-truthsayer-archaeologist-`

function encodeBrowserHistoryImportConfig(
  props: TruthsayerBrowserHistoryImportConfig
) {
  return `${kClassNamePrefix}${base64.encode(JSON.stringify(props))}`
}

export function decodeBrowserHistoryImportConfig(
  className: string
): TruthsayerBrowserHistoryImportConfig {
  const startIndex = className.indexOf(kClassNamePrefix)
  if (startIndex === -1) {
    throw new Error(
      'Failed to decode thruthsayer browser history import props, ' +
        `encoded className is expected to start with ${kClassNamePrefix}` +
        `, full string = "${className}"`
    )
  }

  const endIndex = className.indexOf(' ', startIndex + kClassNamePrefix.length)
  const encodedConfig = className.slice(
    startIndex + kClassNamePrefix.length,
    endIndex !== -1 ? endIndex : undefined
  )
  return JSON.parse(
    base64.decode(encodedConfig)
  ) as TruthsayerBrowserHistoryImportConfig
}

export function TruthsayerBrowserHistoryImportWidget(
  props: TruthsayerBrowserHistoryImportConfig
) {
  return (
    <Box
      id={kTruthsayerBrowserHistoryImportWidgetId}
      className={encodeBrowserHistoryImportConfig(props)}
    />
  )
}
