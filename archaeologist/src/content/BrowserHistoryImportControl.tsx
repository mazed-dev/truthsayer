import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'

import { truthsayer_archaeologist_communication } from 'elementary'

const Box = styled.div``

export function BrowserHistoryImportControl() {
  const container = document.createElement(
    'mazed-archaeologist-browser-history-import-control'
  )
  /**
   * This is an effect to inject element container to the content DOM tree. There
   * are 2 reasons to use `useEffect` for it:
   *
   *   1. We need a clean up (see lambda as a return value of `useEffect`).
   *   Otherwise react would never delete rendered element.
   *   2. Container has to be deleted-and-added __on every render__, otherwise we
   *   would see only first version of the element without any further updates.
   *   There is no dependency list here on purpose, to re-inject container into
   *   the content DOM on every update.
   */
  React.useEffect(() => {
    const target = document.getElementById(
      truthsayer_archaeologist_communication.kTruthsayerBrowserHistoryImportWidgetId
    )
    target?.appendChild(container)
    return () => {
      target?.removeChild(container)
    }
  })
  //TODO(akindyakov): Render browser history control panel here instead of PopUp
  return ReactDOM.createPortal(
    <Box>Some text visible in Truthsayer browser history control widget</Box>,
    container
  )
}
