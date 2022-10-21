import React from 'react'
import styled from '@emotion/styled'

import { log, sleep } from 'armoury'
import {
  TruthsayerBrowserHistoryImportWidget,
  truthsayer_archaeologist_communication,
  Spinner,
} from 'elementary'
import { TruthsayerLink } from '../lib/TrueLink'
import BrowserLogo from '../apps-list/img/GoogleChromeLogo.svg'

export { BrowserLogo }

const Box = styled.div``

const kExpectedArchaeologistVersion = '0.1.16'

type ArchaeologistState = 'not-found' | 'loading' | 'good'
export function BrowserHistoryImporter({ className }: { className?: string }) {
  const [archaeologistState, setArchaeologistState] =
    React.useState<ArchaeologistState>('loading')
  React.useEffect(() => {
    const id: truthsayer_archaeologist_communication.VersionId =
      'mazed-archaeologist-version'
    sleep(250).then(() => {
      const el = window.document.getElementById(id)
      try {
        if (el != null) {
          const version = JSON.parse(
            el.innerHTML
          ) as truthsayer_archaeologist_communication.VersionStruct
          if (kExpectedArchaeologistVersion === version.version) {
            setArchaeologistState('good')
          } else {
            setArchaeologistState('not-found')
          }
        }
      } catch (err) {
        log.error('Archaeologist version deserialization failed with', err)
      }
    })
  }, [])
  return (
    <Box className={className}>
      <TruthsayerBrowserHistoryImportWidget />
      {archaeologistState === 'loading' ? (
        <Spinner.Wheel width={32} />
      ) : archaeologistState === 'not-found' ? (
        <div>
          Compatible version of Mazed browser extension is not found, go to{' '}
          <TruthsayerLink to={'/apps-to-install'}>Mazed Apps</TruthsayerLink> to
          install Mazed for your browser. Expected version of browser extension
          is &ldquo;{kExpectedArchaeologistVersion}&rdquo;.
        </div>
      ) : null}
    </Box>
  )
}
