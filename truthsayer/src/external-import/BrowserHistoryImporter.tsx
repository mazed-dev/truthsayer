import React from 'react'
import styled from '@emotion/styled'
import semver from 'semver'

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

const kMinimalArchaeologistVersion = '0.1.16'

type ArchaeologistState =
  | { type: 'not-found' }
  | { type: 'version-mismatch'; actual: string }
  | { type: 'loading' }
  | { type: 'good' }

/**
 * A truthsayer-side shell of an importer which by itself doesn't define any
 * UI elements to control browser history import, but expects that archaeologist
 * will inject @see BrowserHistoryImportControl augmentation into it at runtime.
 */
export function BrowserHistoryImporter({ className }: { className?: string }) {
  const [archaeologistState, setArchaeologistState] =
    React.useState<ArchaeologistState>({ type: 'loading' })
  React.useEffect(() => {
    // To get Archaeologist version we need 2 things to happen consequentially
    // - Truthsayer page to get fully rendered
    // - Archaeologist augmentation to get rendered
    // And only then we can read Archaeologist version, for this we have to wait
    sleep(2000).then(() => {
      const version =
        truthsayer_archaeologist_communication.getArchaeologistVersion(
          window.document
        )
      if (version == null) {
        setArchaeologistState({ type: 'not-found' })
        return
      }
      const state: ArchaeologistState = semver.gte(
        version.version,
        kMinimalArchaeologistVersion
      )
        ? { type: 'good' }
        : {
            type: 'version-mismatch',
            actual: version.version,
          }
      setArchaeologistState(state)
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
          install Mazed for your browser. Minimal version of browser extension
          is &ldquo;{kMinimalArchaeologistVersion}&rdquo;.
        </div>
      )
    }
    case 'version-mismatch': {
      return (
        <div>
          Mazed browser extension is of version &ldquo;{state.actual}&rdquo;,
          minimal required version is &ldquo;
          {kMinimalArchaeologistVersion}&rdquo;. Ensure you have the latest
          version via{' '}
          <TruthsayerLink to={'/apps-to-install'}>Mazed Apps</TruthsayerLink>.
        </div>
      )
    }
    case 'good': {
      // NOTE: when this is the case, it is expected that archaeologist
      // will inject @see BrowserHistoryImportControl augmentation in place
      // of this 'null'
      return null
    }
  }
}
