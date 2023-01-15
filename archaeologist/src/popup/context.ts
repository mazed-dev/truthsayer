import React from 'react'
import { makeAlwaysThrowingStorageApi, StorageApi } from 'smuggler-api'

export type PopUpContextProps = {
  storage: StorageApi
}

export const PopUpContext = React.createContext<PopUpContextProps>({
  storage: makeAlwaysThrowingStorageApi(),
})
