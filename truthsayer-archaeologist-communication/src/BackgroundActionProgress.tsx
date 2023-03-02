import React from 'react'
import styled from '@emotion/styled'
import type { BackgroundAction } from './message/types'

const Box = styled.div``

function beaconIdFor(action: BackgroundAction): string {
  return `mazed-truthsayer-archaeologist-background-action-progress-widget-for-${action}`
}

/**
 * Namespace that includes all the tools
 *  - needed by truthsayer to tell archaeologist at which position to
 *    inject @see BackgroundActionProgressSpinner augmentation
 *  - needed by archaeologist to understand truthsayer's instructions
 */
export namespace BackgroundActionProgressConnection {
  /** Tools that should only be invoked by truthsayer */
  export namespace truthsayer {
    /** When present in truthsayer's DOM, a beacon signals to archaeologist that
     * it should inject an augmentation with certain config at a certain DOM position.
     */
    export function Beacon({ action }: { action: BackgroundAction }) {
      return <Box id={beaconIdFor(action)} />
    }
  }

  /** Tools that should only be invoked from within archaeologist's content script */
  export namespace archaeologist {
    /** Find an HTML element rendered by @see Beacon, return it */
    export function findBeacon(
      doc: Document,
      action: BackgroundAction
    ): HTMLElement | null {
      return doc.getElementById(beaconIdFor(action))
    }
  }
}
