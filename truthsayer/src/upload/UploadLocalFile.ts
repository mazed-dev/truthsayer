import { NodeCreatedVia, steroid, StorageApi } from 'smuggler-api'
import { MimeType, isAbortError, errorise, log } from 'armoury'

import { TDoc, SlateText } from 'elementary'
import { markdownToSlate } from 'librarius'
import { Mime } from 'armoury'
import { Optional } from 'armoury'

import { FileUploadStatusState } from './UploadNodeButton'

export function uploadLocalFile(
  storage: StorageApi,
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  abortSignal: AbortSignal
): void {
  const mime = Mime.fromString(file.type)
  if (mime == null) {
    throw new Error(
      `Attempted to upload local file ${file.name} of unsupported type ${file.type}`
    )
  }
  const createdVia: NodeCreatedVia = { manualAction: null }
  if (Mime.isText(mime)) {
    uploadLocalTextFile(
      storage,
      file,
      from_nid,
      to_nid,
      createdVia,
      updateStatus,
      abortSignal
    )
  } else {
    steroid.node
      .createFromLocalBinary(file, from_nid, to_nid, createdVia, abortSignal)
      .then((result) => {
        updateStatus({ progress: 1, nid: result.nid, error: result.warning })
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return
        }
        updateStatus({ progress: 1, error: errorise(error).message })
      })
  }
}

// TODO[snikitin@outlook.com] See if this can be moved into steroid.node
// and merged with createFromLocalBinary into a more general
// steroid.node.createFromLocal.
// At the time of this writing it is mostly prevented by the usage of markdownToSlate()
// which is not available at 'steroid' level
function uploadLocalTextFile(
  storage: StorageApi,
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  createdVia: NodeCreatedVia,
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
    const appendix = `\n---\n*From file - "${file.name}" (${
      Math.round((file.size * 100) / 1024) * 100
    }KiB)*\n`
    const text = (event.target?.result || '') + appendix
    const slate = markdownToSlate(text)
    const doc = new TDoc(slate as SlateText)
    storage.node
      .create(
        {
          text: doc.toNodeTextData(),
          from_nid: from_nid ? [from_nid] : undefined,
          to_nid: to_nid ? [to_nid] : undefined,
          extattrs: {
            content_type: MimeType.TEXT_PLAIN,
          },
          created_via: createdVia,
        },
        abortSignal
      )
      .then((node) => {
        const { nid } = node
        updateStatus({ nid, progress: 1.0 })
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

  reader.onerror = () => {
    updateStatus({
      progress: 1,
      error: `reading failed: ${reader.error}`,
    })
  }

  reader.onabort = () => {
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
