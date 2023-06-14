import React from 'react'
import { PostHog } from 'posthog-js'
import { makeAlwaysThrowingStorageApi, StorageApi } from 'smuggler-api'

export type ContentContextProps = {
  analytics?: PostHog
  storage: StorageApi
}

export const ContentContext = React.createContext<ContentContextProps>({
  storage: makeAlwaysThrowingStorageApi(),
})
