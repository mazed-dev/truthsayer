/**
 * APIs that build node indexes "on steroids" (see @alias steroid.ts for more information)
 */

import { smuggler } from '../api'
import { NodeIndexText } from '../types'
import { Mime } from 'armoury'

async function readAllFrom(reader: ReadableStreamDefaultReader) {
  let data: string[] = []
  for (
    let chunk: { done: boolean; value?: string } = { done: false };
    !chunk.done;
    chunk = await reader.read()
  ) {
    if (chunk.value) data.push(chunk.value)
  }

  return data
}

async function fileAsString(file: File) {
  const chunks = await readAllFrom(file.stream().getReader())
  return chunks.join('')
}

export async function nodeIndexFromFile(
  file: File,
  signal?: AbortSignal
): Promise<NodeIndexText> {
  if (!file.type) {
    throw new Error(
      `Attempted to make node index from ${file.name}, but Mime type is not set`
    )
  }

  if (Mime.isText(file.type)) {
    return {
      plaintext: await fileAsString(file),
      labels: [],
      brands: [],
      dominant_colors: [],
    }
  } else if (smuggler.blob_index.cfg.supportsMime(file.type)) {
    const index = await smuggler.blob_index.build([file], signal)
    if (index.indexes.length !== 1) {
      throw new Error(`No index generated for image ${file.name}`)
    }
    return index.indexes[0].index
  }

  throw new Error(
    `Attempted to make node index from ${file.name}, Mime type ${file.type} is not supported`
  )
}
