import React from 'react'
import styled from '@emotion/styled'
import { useAsyncEffect } from 'use-async-effect'

import { MzdGlobalContext } from '../lib/global'

import { log, genOriginId } from 'armoury'
import { Spinner } from 'elementary'
import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'
import BrowserLogo from '../apps-list/img/GoogleChromeLogo.svg'
import { makeDatacenterStorageApi, StorageApi, Nid } from 'smuggler-api'

export { BrowserLogo }

const Box = styled.div``
const Title = styled.div`
  margin-bottom: 10px;
`
const Message = styled.div``

export function NotImplementedMessage() {
  return (
    <Message>Import of local data to Mazed backend is not implemented</Message>
  )
}

async function downloadUserDataFromMazedBackend(
  localStorageApi: StorageApi,
  datacenterStorageApi: StorageApi
): Promise<void> {
  const oldToNewNids: Map<Nid, Nid> = new Map()
  log.debug('Creating an iterator...')
  const iter = datacenterStorageApi.node.iterate()
  log.debug('Done, iterator crated', iter)
  while (true) {
    const node = await iter.next()
    if (node == null) {
      break
    }
    const url = node.extattrs?.web?.url ?? node.extattrs?.web_quote?.url
    const origin = url != null ? genOriginId(url) : undefined
    log.debug('Got node', node, url)
    log.debug('Saving node to local storage...')
    const r = await localStorageApi.node.create({
      text: node.text,
      index_text: node.index_text,
      extattrs: node.extattrs,
      ntype: node.ntype,
      origin: origin ? { ...origin } : undefined,
      created_at: node.created_at.toDate(),
    })
    log.debug('Node is saved', r.nid)
    oldToNewNids.set(node.nid, r.nid)
    log.debug('Saved node', node.nid, r.nid)
  }
  for (const oldNid of oldToNewNids.keys()) {
    const edges = await datacenterStorageApi.edge.get({ nid: oldNid })
    for (const oldEdge of edges.from_edges.concat(edges.to_edges)) {
      const fromNid = oldToNewNids.get(oldEdge.from_nid)
      const toNid = oldToNewNids.get(oldEdge.to_nid)
      log.debug('Saved edge', fromNid, toNid)
      if (fromNid && toNid) {
        await localStorageApi.edge.create({ from: fromNid, to: toNid })
      }
    }
  }
}

const ControlBox = styled.div``
const BoxButtons = styled.div``
const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;

  vertical-align: middle;
  &:hover {
    background-color: #d0d1d2;
  }
`

type LoadingState = { type: 'standby' } | { type: 'loading'; progress: string }

export function DownloadUserDataFromMazedBackendControl() {
  const [loadingState, setLoadingState] = React.useState<LoadingState>({
    type: 'standby',
  })
  const ctx = React.useContext(MzdGlobalContext)
  const sync = React.useCallback(() => {
    log.debug('Creating datacenter storage interface...')
    const datacenterStorageApi = makeDatacenterStorageApi()
    log.debug('Done datacenter storage:', datacenterStorageApi)
    log.debug('Starting the process...')
    downloadUserDataFromMazedBackend(ctx.storage, datacenterStorageApi)
  }, [ctx.storage])
  return (
    <ControlBox>
      <Title>Download fragments stored in Mazed backend</Title>
      <BoxButtons>
        <Button
          onClick={() => {
            setLoadingState({ type: 'loading', progress: '0/?' })
            sync()
          }}
          disabled={loadingState.type === 'loading'}
        >
          {loadingState.type === 'loading' ? (
            <>
              Loading <Spinner.Ring />
            </>
          ) : (
            'Start'
          )}
        </Button>
      </BoxButtons>
    </ControlBox>
  )
}

export function DataCentreImporter({ className }: { className?: string }) {
  const [storageType, setStorageType] = React.useState<
    'loading' | truthsayer_archaeologist_communication.StorageType
  >('loading')
  useAsyncEffect(async () => {
    const settings =
      await truthsayer_archaeologist_communication.getAppSettings()
    setStorageType(settings.storageType)
  })
  let element
  switch (storageType) {
    case 'loading':
      element = <Spinner.Ring />
      break
    case 'browser_ext':
      element = <DownloadUserDataFromMazedBackendControl />
      break
    case 'datacenter':
      element = <NotImplementedMessage />
      break
  }
  return <Box className={className}>{element}</Box>
}
