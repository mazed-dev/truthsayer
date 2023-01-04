/**
 * Node-related APIs "on steroids" (see @alias steroid.ts for more information)
 */

import {
  GenerateBlobIndexResponse,
  NodeCreatedVia,
  NodeIndexText,
  UploadMultipartResponse,
} from '../types'
import { log, Mime, isAbortError, errorise } from 'armoury'
import type { Optional } from 'armoury'
import { StorageApi } from '../storage_api'

// TODO[snikitin@outlook.com] As functions in this module perform
// generation of a file search index, they share a lot of similarities
// with @see nodeIndexFromFile(). It may be beneficial if we can reuse one
// from another since right now new index-related features have to be implemented
// multiple times.

export type FileUploadComplete = {
  nid: string
  warning?: string
}

export type CreateNodeFromLocalBinaryArgs = {
  storage: StorageApi
  file: File
  from_nid: Optional<string>
  to_nid: Optional<string>
  createdVia: NodeCreatedVia
  abortSignal?: AbortSignal
}

/**
 * Upload a local binary file as a *fully featured* Mazed node
 * (as opposed to, for example, @see StorageApi.blob.upload that
 * at the time of this writing creates a node that *doesn't support some
 * Mazed features* like search index).
 */
export async function createNodeFromLocalBinary({
  storage,
  file,
  from_nid,
  to_nid,
  createdVia,
  abortSignal,
}: CreateNodeFromLocalBinaryArgs): Promise<FileUploadComplete> {
  const mime = Mime.fromString(file.type)
  if (!mime || !Mime.isImage(mime)) {
    throw new Error(
      `Attempted to upload a binary file of unsupported type ${file.type}`
    )
  }
  if (file.size > 8000000) {
    throw new Error(`reading failed: file is too big ( ${file.size} > 8MiB)`)
  }

  // Launch both upload & index *generation* at the same time, wait until all
  // promises are settled.
  const [uploadResult, indexResult] = await Promise.allSettled([
    storage.blob.upload(
      { files: [file], from_nid, to_nid, createdVia },
      abortSignal
    ),
    storage.blob_index.build([file], abortSignal),
  ])

  // If upload fails then what happens with index is not important as there is no
  // node to update with one
  if (uploadResult.status === 'rejected') {
    if (isAbortError(uploadResult.reason)) {
      throw uploadResult.reason
    }
    throw new Error(`Submission failed: ${uploadResult.reason}`)
  }

  const upload: UploadMultipartResponse = uploadResult.value
  if (upload.nids.length !== 1) {
    log.debug(
      `Submission failed: unexpected number of uploaded nids = ${upload.nids.length}`
    )
    throw new Error(`Submission failed: internal error`)
  }
  const nid = upload.nids[0]

  const toIndexRelatedWarning = (error: Error) => {
    if (isAbortError(error)) {
      throw error
    }
    return {
      nid,
      warning:
        `Submission succeeded, but failed to generate search index ` +
        `(node will be accessible, but not searchable): ${error}`,
    }
  }

  // When upload succeeds, but index generation fails it's not a critical
  // error as user data is not lost & if index generation is attempted in the
  // future it may still succeed. There is however nothing to update on the
  // successfully created node
  if (indexResult.status === 'rejected') {
    return toIndexRelatedWarning(indexResult.reason)
  }

  const index: GenerateBlobIndexResponse = indexResult.value

  // If both upload & index generation have succeeded then resulting node
  // needs to be updated with generated index to make it searchable

  if (upload.nids.length !== 1 || index.indexes.length !== 1) {
    return toIndexRelatedWarning({
      name: 'logical-error',
      message:
        `Can't resolve which blob index is associated with which file` +
        ` (got ${index.indexes.length} indexes, ${upload.nids.length} upload results)`,
    })
  }

  const index_text: NodeIndexText = index.indexes[0].index
  try {
    await storage.node.update(
      {
        nid: upload.nids[0],
        index_text,
      },
      abortSignal
    )
    return { nid }
  } catch (error) {
    return toIndexRelatedWarning(errorise(error))
  }
}
