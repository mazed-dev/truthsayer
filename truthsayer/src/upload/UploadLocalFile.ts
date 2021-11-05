import { smuggler } from 'smuggler-api'
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

function uploadLocalBinaryFile(
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  abortSignal: AbortSignal
): void {
  if (file.size > 8000000) {
    updateStatus({
      progress: 1,
      error: `reading failed: file is too big ( ${file.size} > 2MiB)`,
    })
  }
  smuggler.blob
    .upload([file], from_nid, to_nid, abortSignal)
    .then((resp) => {
      if (resp) {
        const nid = resp.nids[0]
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
          from_nid,
          to_nid,
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
