/**
 * APIs that build node indexes "on steroids" (see @alias steroid.ts for more information)
 */

import { smuggler } from '../api.js'
import { NodeIndexText } from '../types.js'
import { Mime } from 'armoury'
import type { MimeType } from 'armoury'

async function readAtMost(file: File, maxChars: number) {
  const reader = file.stream().getReader()
  let totalCharsRead = 0
  const data: string[] = []
  for (
    let chunk: { done: boolean; value?: Uint8Array } = { done: false };
    !chunk.done && totalCharsRead < maxChars;
    chunk = await reader.read()
  ) {
    if (chunk.value === undefined) {
      continue
    }
    const chunkStr = new TextDecoder().decode(chunk.value)
    const maxCharsLeft = maxChars - totalCharsRead
    const end = Math.min(chunkStr.length, maxCharsLeft)
    totalCharsRead += end
    data.push(chunkStr.substring(0, end))
  }

  return data.join('')
}

/**
 * Build @see NodeIndexText from a file of any type supported in *Mazed*
 * (as opposed to @see smuggler.blob_index.build which is limited to file types
 * supported by *smuggler*)
 */
export async function nodeIndexFromFile(
  file: File,
  signal?: AbortSignal
): Promise<NodeIndexText> {
  const mime = Mime.fromString(file.type)
  if (mime == null) {
    throw new Error(
      `Attempted to make node index from ${file.name} of unsupported type ${file.type}`
    )
  }

  if (Mime.isText(mime)) {
    return {
      // Cut string by length 10KiB to avoid blowing up backend with huge JSON.
      // Later on we can and perhaps should reconsider this limit.
      plaintext: await readAtMost(file, 10240),
      labels: [],
      brands: [],
      dominant_colors: [],
    }
  } else if (smuggler.blob_index.cfg.supportsMime(mime)) {
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

export function mimeTypeIsSupportedByBuildIndex(mimeType: MimeType) {
  return Mime.isImage(mimeType) || Mime.isText(mimeType)
}
