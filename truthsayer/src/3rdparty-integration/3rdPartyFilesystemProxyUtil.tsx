/**
 * @file Utility functions to work with proxy type of thirdparty filesystems,
 * like @see FileProxy and @see FolderProxy
 */

import {
  makeNodeTextData,
  NodeExtattrs,
  NodeIndexText,
  NodeType,
  CreateNodeArgs,
} from 'smuggler-api'
import { Mime, genOriginId } from 'armoury'
import { FileProxy } from './3rdPartyFilesystem'

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
 * Convert a thirdparty filesystem file to a representation of a node
 */
export async function fileToNode(
  file: FileProxy,
  contents: ReadableStream
): Promise<CreateNodeArgs> {
  if (file.mimeType !== Mime.TEXT_PLAIN) {
    throw new Error(
      `Attempted to convert ${file.path} to a node, Mime type ${file.mimeType} is not supported`
    )
  }
  const fileText = await readAllFrom(
    contents.pipeThrough(new TextDecoderStream()).getReader()
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
  return {
    text: nodeTextData,
    index_text,
    extattrs,
    ntype: NodeType.Url,
    origin: {
      id: origin.id,
    },
  }
}
