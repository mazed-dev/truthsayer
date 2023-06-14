import React from 'react'
import { makeAlwaysThrowingStorageApi, StorageApi } from 'smuggler-api'
import { PostHog } from 'posthog-js'

export type PopUpContextProps = {
  storage: StorageApi
  analytics?: PostHog
}

export const PopUpContext = React.createContext<PopUpContextProps>({
  storage: makeAlwaysThrowingStorageApi(),
})
