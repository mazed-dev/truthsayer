import React from 'react'
import styled from '@emotion/styled'
import semver from 'semver'

import { sleep } from 'armoury'
import { Spinner } from 'elementary'
import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'
import { TruthsayerLink } from '../lib/TrueLink'
import BrowserLogo from '../apps-list/img/GoogleChromeLogo.svg'

export { BrowserLogo }

const Box = styled.div``
const Message = styled.div``
const Comment = styled.div`
  font-style: italic;
  color: grey;
`

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
 * @see truthsayer_archaeologist_communication.BrowserHistoryImport
 * for more information.
 */
export function BrowserHistoryImporter({
  className,
  ...config
}: {
  className?: string
} & truthsayer_archaeologist_communication.BrowserHistoryImport.Config) {
  const [archaeologistState, setArchaeologistState] =
    React.useState<ArchaeologistState>({ type: 'loading' })
  React.useEffect(() => {
    // To get Archaeologist version we need 2 things to happen consequentially
    // - Truthsayer page to get fully rendered
    // - Archaeologist augmentation to get rendered
    // And only then we can read Archaeologist version, for this we have to wait
    sleep(2000).then(() => {
      const version =
        truthsayer_archaeologist_communication.truthsayer.getArchaeologistVersion(
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
      <truthsayer_archaeologist_communication.BrowserHistoryImport.truthsayer.Beacon
        {...config}
      />
      {describe(archaeologistState)}
    </Box>
  )
}

function describe(state: ArchaeologistState) {
  switch (state.type) {
    case 'loading': {
      return (
        <Comment>
          <Spinner.Ring /> Checking browser extension
        </Comment>
      )
    }
    case 'not-found': {
      return (
        <Message>
          Compatible version of Mazed browser extension is not found, go to{' '}
          <TruthsayerLink to={'/apps-to-install'}>Mazed Apps</TruthsayerLink> to
          install Mazed for your browser. Minimal version of browser extension
          is &ldquo;{kMinimalArchaeologistVersion}&rdquo;.
        </Message>
      )
    }
    case 'version-mismatch': {
      return (
        <Message>
          Mazed browser extension is of version &ldquo;{state.actual}&rdquo;,
          minimal required version is &ldquo;
          {kMinimalArchaeologistVersion}&rdquo;. Ensure you have the latest
          version via{' '}
          <TruthsayerLink to={'/apps-to-install'}>Mazed Apps</TruthsayerLink>.
        </Message>
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
