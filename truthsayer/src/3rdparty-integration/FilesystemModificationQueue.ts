import { Client as MsGraphClient } from '@microsoft/microsoft-graph-client'
import { log, MimeType, Mime, Optional } from 'armoury'
import assert from 'assert'
import { DriveItem as MsGraphDriveItem } from 'microsoft-graph'
import * as MsGraph from './MicrosoftGraph'

/**
 * This module implements the algorithm for consuming files and processing
 * them into Mazed, described in https://github.com/Thread-knowledge/truthsayer/issues/148
 */

/** Largest integer timestamp that Javascript's native Date
 * type can handle.
 * In this module it is used as a proxy for "infinity" date,
 * a date that is as far in the future as possible.
 *
 * See https://stackoverflow.com/a/43794682/3375765 for more details
 */
const MAX_TIMESTAMP: number = 8640000000000000

/**
 * A filesystem-agnostic shallow version of a file stored in user's file storage
 * that has all the attributes (regardless of which file system it came from)
 * required for Mazed to process it.
 *
 * "Shallow" in this context means that it intentionally doesn't fetch the
 * contents of the file. This is expected to be important as queues of
 * all unprocessed files may have a large size if a user has a lot of data,
 * in which case loading all files at the same time in memory would be
 * disadvanageous.
 */
export type FileProxy = {
  category: 'file'
  /** A filepath of this file (expected to mostly be useful for debugging) */
  path: string
  /** An ID that uniquely identifies this file within its filesystem */
  id: string
  /** A URL that a user can use to open this file in it's native filesystem */
  webUrl: string

  /** Unix timestamp (seconds) when this file was last modified by a user within its filesystem */
  lastModTimestamp: number
  createdBy: string
  mimeType: MimeType
}

type ChildrenProxy = {
  files: FileProxy[]
  folders: FolderProxy[]
}

type FolderProxy = {
  category: 'folder'
  path: string
  id: string
  /**
   * Unix timestamp (seconds) when this folder was last modified by a user
   * within its filesystem.
   *
   * Note that folder modification date may not behave as intuitively as
   * a @see FileProxy modification date. See https://github.com/Thread-knowledge/truthsayer/issues/148#issuecomment-1048580828
   * for more information
   */
  lastModTimestamp: number

  children: null /** data not fetched yet */ | ChildrenProxy
}

type ModificationSearchRange = {
  /**
   * Unix timestamp (seconds), @see FileProxy for more information
   */
  start: number
  // TODO[snikitin@outlook.com] Currently the algorithm has no way to narrow the
  // search range from the right side. It means it will greedily look for
  // everything in [start, infinity). If a filesystem gets processed by Mazed
  // periodically then this should not cause big problems, unless a giant number
  // of files get added/modified at the same time, diffused throughout giant
  // number of folders.
  //
  // This does however pose a problem for the initial, first-time processing.
  // On the first run it will recurse through the whole filesystem, and if a
  // user has a lot of files then it may result in
  //    - too many calls to filesystem APIs
  //    - too much process memory consumed to hold proxies of all of the files
  //
  // Progress tracking requires files to be processed in order of their
  // modification, but without recursing into each folder it's impossible
  // to know if it has files younger than the ones that have been already
  // detected.
  //
  // So
  //  - on one hand there is a desire to limit the number of files consumed
  //  - on another hand you have to recurse all the way to ensure files are
  // processed in order
  //
  // What optimisations can limit the number of files then?
  end?: undefined
}

async function loadAllFilesInRange(
  graph: MsGraphClient,
  folder: FolderProxy,
  searchRange: ModificationSearchRange
): Promise<FileProxy[]> {
  // 0 ----o----------[s---------------p----------------e)----------y---> time
  //       |           |               |                |           |
  //       |           v               |                v           |
  //       |    *s*tart of search      |        *e*nd of search     |
  //       |    range (inclusive)      |        range (exclusive)   |
  //       |                           |                            |
  //       v                           v                            v
  //  file with last            file that should be         file with last
  //  mod date *o*lder          *p*rocessed                 mod date *y*ounger
  //  than search range                                     then search range
  //  start, should be                                      end, should be
  //  skipped                                               skipped
  if (folder.lastModTimestamp < searchRange.start) {
    // if last modification date of the whole folder is older than the start
    // of search range then it means that there are no files in this folder
    // that were modified in the given search range.
    //
    // NOTE: it may seem intuitive to make a similar assumption with the
    // *end* of search range, but that would be incorrect. If last
    // modification date of the whole folder is younger than the end of search
    // range, it means that there is *at least one* file with last modification
    // date outside of [start, end). But there may be many more files within
    // it.
    return []
  }

  if (!folder.children) {
    folder.children = await fetchChildrenOf(graph, folder)
  }

  const ret: FileProxy[] = folder.children.files.filter(
    (file) => file.lastModTimestamp > searchRange.start
  )
  for (const childFolder of folder.children.folders) {
    ret.concat(await loadAllFilesInRange(graph, childFolder, searchRange))
  }

  return ret
}

async function fetchChildrenOf(
  graph: MsGraphClient,
  parent: FolderProxy
): Promise<ChildrenProxy> {
  assert(!parent.children, `Attempted to fetch folder ${parent.path} twice`)

  const response: MsGraph.ODataResponse<MsGraphDriveItem> = await graph
    .api(`/me/drive/root:${parent.path}:/children`)
    .get()
  const items: MsGraphDriveItem[] = response.value

  const ret: ChildrenProxy = {
    files: [],
    folders: [],
  }

  for (const item of items) {
    const proxy = toProxy(item, parent.path)
    if (!proxy) {
      continue
    }
    if (proxy.category === 'file') {
      ret.files.push(proxy)
    } else {
      ret.folders.push(proxy)
    }
  }

  return ret
}

/**
 * @returns A Unix timestamp with seconds precision
 */
function toUnixSecTimestamp(date: Date): number {
  // See https://stackoverflow.com/a/1792009/3375765 for more info about the implementation
  return date.getTime() / 1000
}

function toProxy(
  msItem: MsGraphDriveItem,
  parentPath: string
): FileProxy | FolderProxy | null {
  const id = msItem.id
  const fsNativeLastModDate = msItem.fileSystemInfo?.lastModifiedDateTime
  const lastModDate = fsNativeLastModDate ? new Date(fsNativeLastModDate) : null

  const path = `${parentPath}/${msItem.name}`

  if (!id || !lastModDate) {
    log.debug(
      'To implement progress tracking of how far did the application ' +
        'progress in indexing filesystem it requires a number of mandatory ' +
        'pieces of information about each filesystem item:\n' +
        `- unique ID (actual = ${msItem.id})\n` +
        `- last modification date (actual = ${msItem.fileSystemInfo?.lastModifiedDateTime})\n`
    )
    return null
  }

  const lastModTimestamp = toUnixSecTimestamp(lastModDate)
  if (msItem.file) {
    const fsNativeMimeType = msItem.file.mimeType
    const mimeType: Optional<MimeType> = fsNativeMimeType
      ? Mime.fromString(fsNativeMimeType)
      : null
    if (!mimeType) {
      log.debug(
        `File ${path} has Mime type ${fsNativeMimeType} which is not one ` +
          'of types supported by the application'
      )
      return null
    }
    if (!msItem.webUrl) {
      log.debug(
        `File ${path} unexpedly does not have a web URL, without it a Mazed` +
          'clicking on a Mazed card that represents it will not be able to open the file'
      )
      return null
    }

    return {
      category: 'file',
      path,
      id,
      webUrl: msItem.webUrl,
      createdBy: msItem.createdBy?.user?.displayName || 'Unknown author',
      lastModTimestamp,
      mimeType,
    }
  } else if (msItem.folder) {
    return {
      category: 'folder',
      path,
      id,
      lastModTimestamp,
      children: { files: [], folders: [] },
    }
  }

  log.debug(
    `Filesystem item ${path} is of unknown category - it's neither a file nor a folder`
  )
  return null
}

/** Comparator that should sort an array of filesystem items such
 * that most recently modified files should be at the *end* of the array.
 *
 * Sorting does not have to be stable with regards to input order (as in -
 * relative order of *input* elements is of no concern), but given a single
 * input array, output should be exactly the same even if input is shuffled
 * randomly.
 * In other words - if there are two items with the same last modifification
 * date, their output order should be predictable.
 */
function oldestModifiedFirstComparator(lhs: FileProxy, rhs: FileProxy) {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
  // for more information on how custom comparator functions
  // should be implemented
  if (lhs.lastModTimestamp === rhs.lastModTimestamp) {
    assert(
      lhs.id !== rhs.id,
      `Two elements with identical IDs ${lhs.id}` +
        'have been detected in an array of filesystem items'
    )
    if (lhs.id < rhs.id) {
      return -1
    }
    return 1
  } else if (lhs.lastModTimestamp < rhs.lastModTimestamp) {
    return -1
  }
  return 1
}

export type QueueParams = {}

/**
 * Fetch a list of files from a filesystem, ordered by their last modification
 * date (first elements are the oldest modified, last elements are most recently
 * modified)
 *
 * @param lastModificationNotOlderThan A Unix timestamp (seconds), defines
 * "last modification date" timerange boundary that will be used to limit file search
 */
export async function make(
  graph: MsGraphClient,
  lastModificationNotOlderThan: number,
  targetFolderPath: string
): Promise<FileProxy[]> {
  const targetFolder: FolderProxy = {
    category: 'folder',
    path: targetFolderPath,
    id: `fake-folder-id-for-${targetFolderPath}`,
    lastModTimestamp: MAX_TIMESTAMP,
    children: null,
  }

  const files = await loadAllFilesInRange(graph, targetFolder, {
    start: lastModificationNotOlderThan,
  })
  return files.sort(oldestModifiedFirstComparator)
}

/**
 * Create an iterable that groups all files with exactly the same last modification
 * timestamp into a single 'batch'.
 *
 * @param queue A queue of files, sorted by their last modification timestamp
 * (e.g. created by @see make)
 */
export function modTimestampBatchIterator(queue: FileProxy[]) {
  // Implemented according to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators#user-defined_iterables
  return {
    *[Symbol.iterator]() {
      for (let batchStart = 0; batchStart < queue.length; ) {
        const isFromNextBatch = (file: FileProxy) => {
          assert(
            !(file.lastModTimestamp < queue[batchStart].lastModTimestamp),
            'modTimestampBatchIterator expects file queue to be sorted by last modification timestamp'
          )
          return file.lastModTimestamp > queue[batchStart].lastModTimestamp
        }
        const nextBatchStart = queue
          .slice(batchStart)
          .findIndex(isFromNextBatch)
        const batchEnd = nextBatchStart === -1 ? queue.length : nextBatchStart
        yield queue.slice(batchStart, batchEnd)

        batchStart = batchEnd
      }
    },
  }
}
