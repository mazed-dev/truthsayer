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
  return (
    <Title>To store data locally please enable local mode in Settings</Title>
  )
}

async function downloadUserDataFromMazedBackend(
  dstStorage: StorageApi,
  srcStorage: StorageApi,
  setLoadingState: (value: LoadingState) => void
): Promise<void> {
  const oldToNewNids: Map<Nid, Nid> = new Map()
  // Data centre implementation of iterator is buggy and sometimes returs same
  // node twice, check for duplicates to prevent creating duplicates in local
  // storage
  const oldNids: Set<Nid> = new Set()
  const iter = await srcStorage.node.iterate()
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
    if (oldNids.has(node.nid)) {
      continue
    }
    oldNids.add(node.nid)
    const url = node.extattrs?.web?.url ?? node.extattrs?.web_quote?.url
    const origin = url != null ? genOriginId(url) : undefined
    const r = await dstStorage.node.create({
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
    const edges = await srcStorage.edge.get({ nid: oldNid })
    for (const oldEdge of edges.from_edges.concat(edges.to_edges)) {
      setLoadingState({
        type: 'loading',
        progress: `Creating associations (${++progressCounter})...`,
      })
      const fromNid = oldToNewNids.get(oldEdge.from_nid)
      const toNid = oldToNewNids.get(oldEdge.to_nid)
      if (fromNid && toNid) {
        await dstStorage.edge.create({ from: fromNid, to: toNid })
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
  const currentStorage = React.useContext(MzdGlobalContext).storage
  const sync = React.useCallback(() => {
    setLoadingState({ type: 'loading', progress: '...' })
    const sourceStorage = makeDatacenterStorageApi()
    downloadUserDataFromMazedBackend(
      currentStorage,
      sourceStorage,
      setLoadingState
    ).catch((reason) =>
      log.error(`Failed to download data from Mazed backend: ${reason}`)
    )
  }, [currentStorage])
  let buttonText
  switch (loadingState.type) {
    case 'loading':
      buttonText = (
        <>
          Downloading <Spinner.Ring /> {loadingState.progress}
        </>
      )
      break
    case 'standby':
      buttonText = <>Download</>
      break
    case 'done':
      buttonText = <>Done 🏁 </>
      break
  }
  return (
    <ControlBox>
      <Title>
        Download fragments from <b>Mazed datacenter</b> to <b>local storage</b>
      </Title>
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
