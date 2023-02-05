import React from 'react'
import styled from '@emotion/styled'
import { useAsyncEffect } from 'use-async-effect'

import * as truthsayer_archaeologist_communication from 'truthsayer-archaeologist-communication'
import { Spinner } from 'elementary'
import { genOriginId, log } from 'armoury'
import { makeDatacenterStorageApi, StorageApi, Nid } from 'smuggler-api'

import { getLogoImage } from '../util/env'
import { MzdGlobalContext } from '../lib/global'

export { getLogoImage }

const Box = styled.div``
const Title = styled.div`
  margin-bottom: 10px;
`
export function NotImplementedMessage() {
  return <div />
}

async function downloadUserDataFromMazedBackend(
  localStorageApi: StorageApi,
  datacenterStorageApi: StorageApi,
  setLoadingState: (value: LoadingState) => void
): Promise<void> {
  const oldToNewNids: Map<Nid, Nid> = new Map()
  const iter = datacenterStorageApi.node.iterate()
  let progressCounter = 0
  // Clone all nodes, saving mapping between { old-nid → new-nid }
  while (true) {
    const node = await iter.next()
    if (node == null) {
      break
    }
    setLoadingState({
      type: 'loading',
      progress: `Downloading fragments (${++progressCounter})...`,
    })
    const url = node.extattrs?.web?.url ?? node.extattrs?.web_quote?.url
    const origin = url != null ? genOriginId(url) : undefined
    const r = await localStorageApi.node.create({
      text: node.text,
      index_text: node.index_text,
      extattrs: node.extattrs,
      ntype: node.ntype,
      origin: origin ? { ...origin } : undefined,
      created_at: node.created_at.unix(),
    })
    oldToNewNids.set(node.nid, r.nid)
  }
  // Clone all edges
  progressCounter = 0
  for (const oldNid of oldToNewNids.keys()) {
    const edges = await datacenterStorageApi.edge.get({ nid: oldNid })
    for (const oldEdge of edges.from_edges.concat(edges.to_edges)) {
      setLoadingState({
        type: 'loading',
        progress: `Creating associations (${++progressCounter})...`,
      })
      const fromNid = oldToNewNids.get(oldEdge.from_nid)
      const toNid = oldToNewNids.get(oldEdge.to_nid)
      if (fromNid && toNid) {
        await localStorageApi.edge.create({ from: fromNid, to: toNid })
      }
    }
  }
  setLoadingState({ type: 'done' })
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

type LoadingState =
  | { type: 'standby' }
  | { type: 'loading'; progress: string }
  | { type: 'done' }
export function DownloadUserDataFromMazedBackendControl() {
  const [loadingState, setLoadingState] = React.useState<LoadingState>({
    type: 'standby',
  })
  const ctx = React.useContext(MzdGlobalContext)
  const sync = React.useCallback(() => {
    setLoadingState({ type: 'loading', progress: '...' })
    const datacenterStorageApi = makeDatacenterStorageApi()
    downloadUserDataFromMazedBackend(
      ctx.storage,
      datacenterStorageApi,
      setLoadingState
    )
  }, [ctx.storage])
  let buttonText
  switch (loadingState.type) {
    case 'loading':
      buttonText = (
        <>
          Loading <Spinner.Ring /> {loadingState.progress}
        </>
      )
      break
    case 'standby':
      buttonText = <>Start</>
      break
    case 'done':
      buttonText = <>Done 🏁 </>
      break
  }
  return (
    <ControlBox>
      <Title>Download fragments from Mazed backend</Title>
      <BoxButtons>
        <Button onClick={sync} disabled={loadingState.type !== 'standby'}>
          {buttonText}
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
