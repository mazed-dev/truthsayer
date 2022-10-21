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

const kExpectedArchaeologistVersion =
  process.env.REACT_APP_EXPECTED_ARCHAEOLOGIST_VER

type ArchaeologistState =
  | { type: 'not-found' }
  | { type: 'version-mismatch'; actual: string }
  | { type: 'loading' }
  | { type: 'good' }
export function BrowserHistoryImporter({ className }: { className?: string }) {
  const [archaeologistState, setArchaeologistState] =
    React.useState<ArchaeologistState>({ type: 'loading' })
  React.useEffect(() => {
    const id: truthsayer_archaeologist_communication.VersionId =
      'mazed-archaeologist-version'
    sleep(250).then(() => {
      const el = window.document.getElementById(id)
      if (el == null) {
        setArchaeologistState({ type: 'not-found' })
        return
      }
      try {
        const version = JSON.parse(
          el.innerHTML
        ) as truthsayer_archaeologist_communication.VersionStruct
        if (kExpectedArchaeologistVersion === version.version) {
          setArchaeologistState({ type: 'good' })
        } else {
          setArchaeologistState({
            type: 'version-mismatch',
            actual: version.version,
          })
        }
      } catch (err) {
        log.error('Archaeologist version deserialization failed with', err)
      }
    })
  }, [])

  return (
    <Box className={className}>
      <TruthsayerBrowserHistoryImportWidget />
      {describe(archaeologistState)}
    </Box>
  )
}

function describe(state: ArchaeologistState) {
  switch (state.type) {
    case 'loading': {
      return <Spinner.Wheel width={32} />
    }
    case 'not-found': {
      return (
        <div>
          Compatible version of Mazed browser extension is not found, go to{' '}
          <TruthsayerLink to={'/apps-to-install'}>Mazed Apps</TruthsayerLink> to
          install Mazed for your browser. Expected version of browser extension
          is &ldquo;{kExpectedArchaeologistVersion}&rdquo;.
        </div>
      )
    }
    case 'version-mismatch': {
      return (
        <div>
          Mazed browser extension is of version &ldquo;{state.actual}&rdquo;,
          expected &ldquo;
          {kExpectedArchaeologistVersion}&rdquo;. Ensure the versions match via{' '}
          <TruthsayerLink to={'/apps-to-install'}>Mazed Apps</TruthsayerLink>.
        </div>
      )
    }
    case 'good': {
      return null
    }
  }
}
