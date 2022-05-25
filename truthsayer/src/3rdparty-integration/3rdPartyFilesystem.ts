/**
 * @file Primitives to work generically with a thirdparty cloud filesystem
 */
import { MimeType } from 'armoury'

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

export type ChildrenProxy = {
  files: FileProxy[]
  folders: FolderProxy[]
}

export type FolderProxy = {
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

export interface ThirdpartyFs {
  childrenOf: (folder: FolderProxy) => Promise<ChildrenProxy>
  download: (file: FileProxy) => Promise<File>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}
