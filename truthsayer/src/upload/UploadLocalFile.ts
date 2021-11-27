import {
  GenerateBlobIndexResponse,
  NodeTextIndex,
  smuggler,
  UploadMultipartResponse,
} from 'smuggler-api'
import * as log from '../util/log'
import { isAbortError } from '../util/exception'

import { makeDoc } from '../doc/doc_util'
import { MimeType } from '../util/Mime'
import { Optional } from '../util/types'

import { FileUploadStatusState } from './UploadNodeButton'

export function uploadLocalFile(
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  abortSignal: AbortSignal
): void {
  const contextType = MimeType.parse(file.type)
  if (contextType.isText()) {
    uploadLocalTextFile(file, from_nid, to_nid, updateStatus, abortSignal)
  } else {
    uploadLocalBinaryFile(file, from_nid, to_nid, updateStatus, abortSignal)
  }
}

async function uploadLocalBinaryFile(
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  abortSignal: AbortSignal
): Promise<void> {
  if (file.size > 8000000) {
    updateStatus({
      progress: 1,
      error: `reading failed: file is too big ( ${file.size} > 2MiB)`,
    })
  }

  // Launch both upload & index *generation* at the same time, wait until all
  // promises are settled.
  const [uploadResult, indexResult] = await Promise.allSettled([
    smuggler.blob.upload([file], from_nid, to_nid, abortSignal),
    smuggler.blob_index.build([file], abortSignal),
  ])

  // If upload fails then what happens with index is not important as there is no
  // node to update with one
  if (uploadResult.status === 'rejected') {
    if (!isAbortError(uploadResult.reason)) {
      log.exception(uploadResult.reason)
      updateStatus({
        progress: 1,
        error: `Submission failed: ${uploadResult.reason}`,
      })
    }
    return
  }

  const upload: UploadMultipartResponse = uploadResult.value
  const nid = upload.nids.length !== 0 ? upload.nids[0] : undefined

  const updateStatusOnIndexError = (error: Error) => {
    if (isAbortError(error)) {
      return
    }
    log.exception(error)
    updateStatus({
      nid,
      progress: 1,
      error:
        `Submission succeeded, but failed to generate search index ` +
        `(node will be accessible, but not searchable): ${error}`,
    })
  }

  // When upload succeeds, but index generation fails it's not a critical
  // error as user data is not lost & if index generation is attempted in the
  // future it may still succeed. There is however nothing to update on the
  // successfully created node
  if (indexResult.status === 'rejected') {
    updateStatusOnIndexError(indexResult.reason)
    return
  }

  const index: GenerateBlobIndexResponse = indexResult.value

  // If both upload & index generation have succeeded then resulting node
  // needs to be updated with generated index to make it searchable

  if (upload.nids.length !== 1 || index.indexes.length !== 1) {
    updateStatusOnIndexError({
      name: 'logical-error',
      message:
        `Can't resolve which blob index is associated with which file` +
        ` (got ${index.indexes.length} indexes, ${upload.nids.length} upload results)`,
    })
    return
  }

  const index_text: NodeTextIndex = index.indexes[0].index
  smuggler.node
    .update({
      nid: upload.nids[0],
      index_text,
      signal: abortSignal,
    })
    .then((resp) => {
      if (resp.ok) {
        updateStatus({ nid, progress: 1.0 })
      } else {
        updateStatusOnIndexError({
          name: 'http-error',
          message: `(${resp.status}) ${resp.statusText}`,
        })
      }
    })
    .catch(updateStatusOnIndexError)
}

function uploadLocalTextFile(
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  abortSignal: AbortSignal
): void {
  if (file.size > 2000000) {
    updateStatus({
      progress: 1,
      error: `reading failed: file is too big ( ${file.size} > 2MiB)`,
    })
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    const appendix = `\n---\n*From file - "${file.name}" (\`${
      Math.round((file.size * 100) / 1024) * 100
    }KiB\`)*\n`
    const text = (event.target?.result || '') + appendix
    makeDoc({ plain: text }).then((doc) => {
      smuggler.node
        .create({
          doc: doc.toNodeTextData(),
          from_nid: from_nid || undefined,
          to_nid: to_nid || undefined,
          signal: abortSignal,
        })
        .then((node) => {
          if (node) {
            const nid = node.nid
            updateStatus({ nid, progress: 1.0 })
          }
        })
        .catch((err) => {
          if (isAbortError(err)) {
            return
          }
          log.exception(err)
          updateStatus({
            progress: 1,
            error: `Submission failed: ${err}`,
          })
        })
    })
  }

  reader.onerror = (event) => {
    updateStatus({
      progress: 1,
      error: `reading failed: ${reader.error}`,
    })
  }

  reader.onabort = (event) => {
    updateStatus({
      progress: 1,
      error: `reading aborted: ${reader.abort}`,
    })
  }

  reader.onprogress = (event) => {
    if (event.loaded && event.total) {
      const percent = (event.loaded / event.total) * 0.5
      updateStatus({ progress: percent })
    }
  }

  reader.readAsText(file)
}
