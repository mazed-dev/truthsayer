import { StorageApi } from './storage_api'

/**
 * Make an implementation of @see StorageApi that throws an error on
 * every call to every method
 */
export function makeAlwaysThrowingStorageApi(): StorageApi {
  const throwError = (..._: any[]): never => {
    throw new Error(
      `Attempted to call an always throwing implementation of StorageApi`
    )
  }

  return {
    node: {
      get: throwError,
      getByOrigin: throwError,
      getAllNids: throwError,
      update: throwError,
      create: throwError,
      iterate: throwError,
      delete: throwError,
      bulkDelete: throwError,
      batch: {
        get: throwError,
      },
      url: throwError,
    },
    blob: {
      upload: throwError,
      sourceUrl: throwError,
    },
    blob_index: {
      build: throwError,
      cfg: {
        supportsMime: throwError,
      },
    },
    edge: {
      create: throwError,
      get: throwError,
      sticky: throwError,
      delete: throwError,
    },
    activity: {
      external: {
        add: throwError,
        get: throwError,
      },
      association: {
        record: throwError,
        get: throwError,
      },
    },
    external: {
      ingestion: {
        get: throwError,
        advance: throwError,
      },
    },
  }
}
