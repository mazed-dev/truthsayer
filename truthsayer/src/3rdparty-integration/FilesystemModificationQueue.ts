import { Client as MsGraphClient } from '@microsoft/microsoft-graph-client'
import { log, MimeType, Mime, Optional } from 'armoury'
import assert from 'assert'
import { DriveItem as MsGraphDriveItem } from 'microsoft-graph'
import * as MsGraph from './MicrosoftGraph'

/** Largest integer timestamp that Javascript's native Date
 * type can handle.
 * In this module it is used as a proxy for "infinity" date,
 * a date that is as far in the future as possible.
 *
 * See https://stackoverflow.com/a/43794682/3375765 for more details
 */
const MAX_TIMESTAMP: number = 8640000000000000

// TODO[snikitin@outlook.com] Describe that the reason why this type
// exists:
//  - to bring code closer to supporting storages other than OneDrive
//  - to reduce the amount of memory Queue consumes (MsGraphDriveItem
// is very large for example)
type FileProxy = {
  category: 'file'
  path: string
  id: string
  webUrl: string

  lastModDate: Date
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
  lastModDate: Date

  children: null /** data not fetched yet */ | ChildrenProxy
}

// type RootFolder = FolderProxy & {
//   path: '/'
// }

type FsItem = FolderProxy | FileProxy

type ModificationSearchRange = {
  start: Date
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
  if (folder.lastModDate < searchRange.start) {
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
    (file) => file.lastModDate > searchRange.start
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
      lastModDate,
      mimeType,
    }
  } else if (msItem.folder) {
    return {
      category: 'folder',
      path,
      id,
      lastModDate,
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
function oldestModifiedFirstComparator(lhs: FsItem, rhs: FsItem) {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
  // for more information on how custom comparator functions
  // should be implemented
  if (lhs.lastModDate === rhs.lastModDate) {
    assert(
      lhs.id !== rhs.id,
      `Two elements with identical IDs ${lhs.id}` +
        'have been detected in an array of filesystem items'
    )
    if (lhs.id < rhs.id) {
      return -1
    }
    return 1
  } else if (lhs.lastModDate < rhs.lastModDate) {
    return -1
  }
  return 1
}

export type QueueParams = {}

/**
 * Fetch a list of files from a filesystem, ordered by their last modification
 * date (first elements are the oldest modified, last elements are most recently
 * modified)
 */
export async function make(
  graph: MsGraphClient,
  lastModificationNotOlderThan: Date,
  targetFolderPath: string
): Promise<FileProxy[]> {
  const targetFolder: FolderProxy = {
    category: 'folder',
    path: targetFolderPath,
    id: `fake-folder-id-for-${targetFolderPath}`,
    lastModDate: new Date(MAX_TIMESTAMP),
    children: null,
  }

  const files = await loadAllFilesInRange(graph, targetFolder, {
    start: lastModificationNotOlderThan,
  })
  files.sort(oldestModifiedFirstComparator)
  return files
}
