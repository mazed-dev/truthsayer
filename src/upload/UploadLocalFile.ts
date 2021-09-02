import { smugler, CancelToken } from '../smugler/api'
import { debug } from '../util/log'

import { exctractDoc } from '../doc/doc_util'
import { MimeType } from '../util/Mime'
import { Optional } from '../util/types'

import { FileUploadStatusState } from './UploadNodeButton'

export function uploadLocalFile(
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  cancelToken: CancelToken
): void {
  const contextType = MimeType.parse(file.type)
  if (contextType.isText()) {
    uploadLocalTextFile(file, from_nid, to_nid, updateStatus, cancelToken)
  } else {
    uploadLocalBinaryFile(file, from_nid, to_nid, updateStatus, cancelToken)
  }
}

function uploadLocalBinaryFile(
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  cancelToken: CancelToken
): void {
  if (file.size > 8000000) {
    updateStatus({
      error: `reading failed: file is too big ( ${file.size} > 2MiB)`,
    })
  }
  smugler.blob
    .upload({ files: [file], cancelToken, from_nid, to_nid })
    .then((resp) => {
      if (resp) {
        const nid = resp.nids[0]
        updateStatus({ nid, progress: 1.0 })
      }
    })
    .catch((err) => updateStatus({ error: `Submission failed: ${err}` }))
}

function uploadLocalTextFile(
  file: File,
  from_nid: Optional<string>,
  to_nid: Optional<string>,
  updateStatus: (upd: FileUploadStatusState) => void,
  cancelToken: CancelToken
): void {
  if (file.size > 2000000) {
    updateStatus({
      error: `reading failed: file is too big ( ${file.size} > 2MiB)`,
    })
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    debug('Loaded to memory', event)
    const appendix = `\n---\n*From file - "${file.name}" (\`${
      Math.round((file.size * 100) / 1024) * 100
    }KiB\`)*\n`
    const text = event.target.result + appendix
    exctractDoc(text).then((doc) => {
      smugler.node
        .create({ doc, from_nid, to_nid, cancelToken })
        .then((node) => {
          if (node) {
            const nid = node.nid
            updateStatus({ nid, progress: 1.0 })
          }
        })
        .catch((err) => updateStatus({ error: `Submission failed: ${err}` }))
    })
  }

  reader.onerror = (event) => {
    updateStatus({
      error: `reading failed: ${reader.error}`,
    })
  }

  reader.onabort = (event) => {
    updateStatus({
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
