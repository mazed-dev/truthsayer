import React from 'react'
import styled from '@emotion/styled'
import semver from 'semver'

import { sleep } from 'armoury'
import { Spinner } from 'elementary'
import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'
import { TruthsayerLink } from '../lib/TrueLink'
import BrowserLogo from '../apps-list/img/GoogleChromeLogo.svg'
import { ArchaeologistState } from '../apps-list/archaeologistState'

export { BrowserLogo }

const Box = styled.div``
const Message = styled.div``
const Comment = styled.div`
  font-style: italic;
  color: grey;
`

const kMinimalArchaeologistVersion = '0.1.16'

type BrowserHistoryImporterState =
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
  archaeologistState,
  ...config
}: {
  className?: string
  archaeologistState: ArchaeologistState
} & truthsayer_archaeologist_communication.BrowserHistoryImport.Config) {
  let state: BrowserHistoryImporterState = { type: 'loading' }
  switch (archaeologistState.state) {
    case 'loading': {
      state = { type: 'loading' }
      break
    }
    case 'installed': {
      state = semver.gte(
        archaeologistState.version.version,
        kMinimalArchaeologistVersion
      )
        ? { type: 'good' }
        : {
            type: 'version-mismatch',
            actual: archaeologistState.version.version,
          }
      break
    }
    case 'not-installed': {
      state = { type: 'not-found' }
      break
    }
  }

  return (
    <Box className={className}>
      <truthsayer_archaeologist_communication.BrowserHistoryImport.truthsayer.Beacon
        {...config}
      />
      {describe(state)}
    </Box>
  )
}

function describe(state: BrowserHistoryImporterState) {
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
