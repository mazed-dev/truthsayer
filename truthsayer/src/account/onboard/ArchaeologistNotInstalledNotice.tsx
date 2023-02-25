/** @jsxImportSource @emotion/react */

import React from 'react'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'
import { useAsyncEffect } from 'use-async-effect'
import { log } from 'armoury'
import { routes } from '../../lib/route'
import { ArchaeologistState } from '../../apps-list/archaeologistState'

const Box = styled.div`
  with: 100%;
  margin: 12px;
  padding-left: 20px;
`

const Message = styled.div`
  color: #a9a9a9;
  padding-top: 8px;
`

export function ArchaeologistNotInstalledNotice({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}) {
  const [storageType, setStorageType] = React.useState<
    'loading' | truthsayer_archaeologist_communication.StorageType
  >('loading')
  useAsyncEffect(async () => {
    const settings =
      await truthsayer_archaeologist_communication.getAppSettings()
    log.debug('Mazed Settings', settings)
    setStorageType(settings.storageType)
  })
  if (
    archaeologistState.state === 'not-installed' &&
    storageType === 'browser_ext'
  ) {
    return (
      <Box>
        <Message>
          ⚠️ To use Mazed in Local Mode, you must have Mazed extension installed
          in your browser.
        </Message>
        <Message>
          ℹ️ You can install the extension on a page{' '}
          <Link to={routes.apps}>
            Profile → <q>Apps</q> → <q>Mazed for Chrome</q>
          </Link>
        </Message>
      </Box>
    )
  }
  return null
}
