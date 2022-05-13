/**
 * @file Utility functions to work with proxy type of thirdparty filesystems,
 * like @see FileProxy and @see FolderProxy
 */

import { NodeExtattrs } from 'smuggler-api'
import { Mime } from 'armoury'
import { FileProxy } from './3rdPartyFilesystem'

async function beginningOf(blob: Blob) {
  const reader = blob.stream().getReader()
  let ret = ''
  for (
    let chunk: { done: boolean; value?: string } = { done: false };
    !chunk.done && ret.length < 256;
    chunk = await reader.read()
  ) {
    if (chunk.value) ret += chunk.value
  }
  return ret.length < 256 ? ret : ret.substring(0, 256) + '...'
}

/**
 * Compose @see NodeExtattrs for a thirdparty filesystem file
 */
export async function extattrsFromFile(
  file: FileProxy,
  contents: File
): Promise<NodeExtattrs> {
  return {
    content_type: Mime.TEXT_URI_LIST,
    preview_image: undefined,
    title: '☁ ' + file.path,
    description: Mime.isText(file.mimeType) ? await beginningOf(contents) : '',
    lang: undefined,
    author: file.createdBy,
    web: {
      url: file.webUrl,
    },
    blob: undefined,
  }
}
