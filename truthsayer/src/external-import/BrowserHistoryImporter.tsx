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
    const id: truthsayer_archaeologist_communication.VersionId =
      'mazed-archaeologist-version'
    sleep(
      // TODO[snikitin@outlook.com] This sleep is unreliable and leads to confusing
      // results.
      //
      // This code has 3 "actors":
      //   1. a @see ArchaeologistVersion augmentation that archaeologist injects
      //      into truthsayer
      //   2. an error or status from @see describe() that truthsayer should
      //      display if ArchaeologistVersion hasn't been injected yet
      //   3. a @see BrowserHistoryImportControl augmentation that archaeologist
      //      injects into truthsayer
      //
      // 1st actor is used purely behind the scenes, invisible to users.
      // 2nd and 3rd are the stars of the show, and from user's perspective they
      // are *mutually exclusive* - you either get an error/spinner or access
      // to functionality.
      //
      // Currently actor 3 gets injected *alongside* actor 2 (as opposed to
      // an overwriting injection which *replaces* actor 2 with actor 3).
      //
      // 3rd actor gets *unconditionally injected* whenever archaeologist's
      // content script gets loaded, unrelated to anything that happens in truthsayer.
      // Since from a user perspective 2nd and 3rd shouldn't be both visible,
      // this sleep is used to give actor 2 enough time to figure out if it should
      // hide itself or not, and it does so by checking 1st actor -- that's the only
      // use of 1st actor.
      // But if sleep duration is too low then both 2nd and 3rd will be visible
      // which is confusing.
      //
      // Is it possible to do an "overwrite" augmentation? That would remove
      // situations when both 2nd and 3rd are visible and potentially remove
      // the need for 1st.
      // Or make init more deterministic some other way?
      2000
    ).then(() => {
      const el = window.document.getElementById(id)
      if (el == null) {
        setArchaeologistState({ type: 'not-found' })
        return
      }
      let version: truthsayer_archaeologist_communication.VersionStruct | null =
        null
      try {
        version = JSON.parse(
          el.innerHTML
        ) as truthsayer_archaeologist_communication.VersionStruct
      } catch (err) {
        log.error('Archaeologist version deserialization failed with', err)
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
