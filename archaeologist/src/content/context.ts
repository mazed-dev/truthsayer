import React from 'react'
import { PostHog } from 'posthog-js'
import { makeAlwaysThrowingStorageApi, StorageApi } from 'smuggler-api'

export type ContentContextProps = {
  analytics: PostHog | null
  storage: StorageApi
}

export const ContentContext = React.createContext<ContentContextProps>({
  analytics: null,
  storage: makeAlwaysThrowingStorageApi(),
})
