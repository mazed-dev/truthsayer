/**
 * @file Utility functions to work with proxy type of thirdparty filesystems,
 * like @see FileProxy and @see FolderProxy
 */

import { NodeExtattrs } from 'smuggler-api'
import { Mime, MimeType } from 'armoury'
import {
  FileProxy,
  FileProxyDetails,
  ImageProxyDetails,
} from './3rdPartyFilesystem'

async function beginningOf(blob: Blob) {
  const reader = blob.stream().getReader()
  let ret = ''
  for (
    let chunk: { done: boolean; value?: Uint8Array } = { done: false };
    !chunk.done && ret.length < 256;
    chunk = await reader.read()
  ) {
    if (chunk.value) ret += chunk.value
  }
  return ret.length < 256 ? ret : ret.substring(0, 256) + '...'
}

function isImageProxy(details: FileProxyDetails): details is ImageProxyDetails {
  return Mime.isImage(details.mimeType)
}

async function imageUrlToDataUrl(imageUrl: string) {
  let blob = await fetch(imageUrl).then((r) => r.blob())
  let dataUrl = await new Promise<string>((resolve) => {
    let reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
  return dataUrl
}

/**
 * Compose @see NodeExtattrs for a thirdparty filesystem file
 */
export async function extattrsFromFile(
  file: FileProxy,
  contents: File
): Promise<NodeExtattrs> {
  return {
    content_type: MimeType.TEXT_URI_LIST,
    preview_image: isImageProxy(file.details)
      ? { data: await imageUrlToDataUrl(file.details.previewUrl) }
      : undefined,
    title: '☁ ' + file.path,
    description: Mime.isText(file.details.mimeType)
      ? await beginningOf(contents)
      : '',
    lang: undefined,
    author: file.createdBy,
    web: {
      url: file.webUrl,
    },
    blob: undefined,
  }
}
