import React from 'react'
import styled from '@emotion/styled'

import { MdiPublic } from 'elementary'
import BrowserLogo from '../apps-list/img/GoogleChromeLogo.svg'

export { BrowserLogo }

const Box = styled.div``

export const Logo = styled(MdiPublic)``

type ArchaeologistState = 'not-found' | 'too-old' | 'good'
export function BrowserHistoryImporter({ className }: { className?: string }) {
  const [archaeologistState, setArchaeologistState] =
    React.useState<ArchaeologistState>('not-found')
  React.useEffect(() => {
    // <script type="application/ld+json" id="mazed-archaeologist-app-details" nonce="hCcqWVuWVN0iopMKzxtUIg" class="style-scope ytd-player-microformat-renderer">{"version":"0.1.12", "uid": ""}</script>
    const archaeologistEl = window.document.getElementById(
      'mazed-archaeologist-content-mount'
    )
    if (archaeologistEl != null) {
      setArchaeologistState('good')
    }
  }, [])
  return <Box className={className}>Todo "{archaeologistState}"</Box>
}
