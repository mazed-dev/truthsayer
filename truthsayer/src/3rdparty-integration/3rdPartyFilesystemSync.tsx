/**
 * @file Helpers to ingest user files hosted in a thirdparty filesystem into Mazed
 */

import {
  makeNodeTextData,
  NodeExtattrs,
  NodeIndexText,
  NodeType,
  smuggler,
  UserFilesystemId,
  AccountInterface,
} from 'smuggler-api'
import { Mime, log, genOriginId } from 'armoury'
import * as FsModificationQueue from './FilesystemModificationQueue'
import { FileProxy, ThirdpartyFs } from './3rdPartyFilesystem'

async function readAllFrom(reader: ReadableStreamDefaultReader<string>) {
  let data = ''
  for (
    let chunk: { done: boolean; value?: string } = { done: false };
    !chunk.done;
    chunk = await reader.read()
  ) {
    if (chunk.value) data += chunk.value
  }

  return data
}

function beginningOf(text: string) {
  if (text.length < 256) {
    return text
  }
  return text.length < 256 ? text : text.substring(0, 256) + '...'
}

/**
 * Upload all files from a given filesystem to Mazed, if they have not been
 * uploaded before.
 */
export async function uploadFilesFromFolder(
  fs: ThirdpartyFs,
  account: AccountInterface,
  folderPath: string
) {
  const fsid: UserFilesystemId = {
    uid: account.getUid(),
    fs_key: 'onedrive',
  }
  const current_progress = await smuggler.user.thirdparty.fs.progress.get(fsid)
  const files = await FsModificationQueue.make(
    fs,
    current_progress.ingested_until,
    folderPath
  )
  for (const batch of FsModificationQueue.modTimestampBatchIterator(files)) {
    for (const file of batch) {
      await uploadSingleFile(fs, file)
    }
    await smuggler.user.thirdparty.fs.progress.advance(fsid, {
      ingested_until: batch[0].lastModTimestamp,
    })
  }
}

async function uploadSingleFile(fs: ThirdpartyFs, file: FileProxy) {
  if (file.mimeType !== Mime.TEXT_PLAIN) {
    log.debug(
      `Skipping ${file.path} due to unsupported Mime type ${file.mimeType}`
    )
    return
  }

  const stream: ReadableStream = await fs.download(file)

  const fileText = await readAllFrom(
    stream.pipeThrough(new TextDecoderStream()).getReader()
  )
  const nodeTextData = makeNodeTextData()
  const index_text: NodeIndexText = {
    plaintext: fileText,
    labels: [],
    brands: [],
    dominant_colors: [],
  }
  const extattrs: NodeExtattrs = {
    content_type: Mime.TEXT_URI_LIST,
    preview_image: undefined,
    title: '☁ ' + file.path,
    description: beginningOf(fileText),
    lang: undefined,
    author: file.createdBy,
    web: {
      url: file.webUrl,
    },
    blob: undefined,
  }

  const origin = await genOriginId(file.webUrl)
  const response = await smuggler.node.createOrUpdate({
    text: nodeTextData,
    index_text,
    extattrs,
    ntype: NodeType.Url,
    origin: {
      id: origin.id,
    },
  })
  log.debug(`Response to node creation/update: ${JSON.stringify(response)}`)
}
