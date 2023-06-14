/**
 * Implementation of @see ThirdpartyFs for Microsoft OneDrive
 */

import { Client as MsGraphClient } from '@microsoft/microsoft-graph-client'
import { log, MimeType, Mime, Optional } from 'armoury'
import {
  DriveItem as MsGraphDriveItem,
  ThumbnailSet as MsThumbnailSet,
} from 'microsoft-graph'
import {
  PopupRequest,
  PublicClientApplication as MsPublicClientApplication,
} from '@azure/msal-browser'
import {
  ChildrenProxy,
  FileProxy,
  FileProxyDetails,
  FolderProxy,
  ThirdpartyFs,
} from './3rdPartyFilesystem'
import * as MsGraph from './MicrosoftGraph'

/**
 * @returns A Unix timestamp with seconds precision
 */
function toUnixSecTimestamp(date: Date): number {
  // See https://stackoverflow.com/a/1792009/3375765 for more info about the implementation
  return date.getTime() / 1000
}

function thumbnailUrlFrom(
  thumbnails: MsThumbnailSet[] | null | undefined
): string | undefined {
  if (!thumbnails) {
    return
  }
  return thumbnails[0].small?.url || undefined
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
        `File ${path} unexpedly does not have a web URL, without it a Foreword` +
          'clicking on a Foreword card that represents it will not be able to open the file'
      )
      return null
    }

    // TODO[snikitin@outlook.com] This should probably be some local image, deployed
    // alongside truthsayer
    const nopreviewUrl: string =
      'https://image.shutterstock.com/image-vector/picture-line-icon-image-vector-600w-1841782459.jpg'
    const details: FileProxyDetails = Mime.isImage(mimeType)
      ? {
          mimeType,
          previewUrl: thumbnailUrlFrom(msItem.thumbnails) || nopreviewUrl,
        }
      : { mimeType }
    return {
      category: 'file',
      path,
      id,
      webUrl: msItem.webUrl,
      createdBy: msItem.createdBy?.user?.displayName || 'Unknown author',
      lastModTimestamp,
      details,
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

async function streamAsFile(file: FileProxy, contents: ReadableStream) {
  const chunks = await readAllFrom(contents.getReader())
  return new File(chunks, file.path, {
    lastModified: file.lastModTimestamp,
    type: file.details.mimeType,
  })
}

export class OneDriveFs implements ThirdpartyFs {
  constructor(msAuthentication: MsPublicClientApplication) {
    this.#auth = msAuthentication
    this.#graph = null
  }

  public async childrenOf(folder: FolderProxy): Promise<ChildrenProxy> {
    const response: MsGraph.ODataResponse<MsGraphDriveItem> = await this.graph()
      .api(`/me/drive/root:${folder.path}:/children`)
      // In addition to default-populated fields, opt-in to request MsGraphDriveItem.thumbnails
      .expand('thumbnails')
      .get()
    const items: MsGraphDriveItem[] = response.value

    const ret: ChildrenProxy = {
      files: [],
      folders: [],
    }

    for (const item of items) {
      const proxy = toProxy(item, folder.path)
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

  public async download(file: FileProxy): Promise<File> {
    const stream: ReadableStream = await this.graph()
      .api(`/me/drive/items/${file.id}/content`)
      .getStream()
    return streamAsFile(file, stream)
  }

  public async signIn() {
    const loginRequest: PopupRequest = {
      // Below is the list of Microsoft Graph scopes the client application
      // will ask authorization for. User will need to explicitely consent.
      scopes: MsGraph.scopes(['User.Read', 'Files.Read']),
    }
    return this.#auth.loginPopup(loginRequest).then(() => {
      return
    })
  }

  public async signOut() {
    return this.#auth.logoutPopup({
      mainWindowRedirectUri: '/',
    })
  }

  private graph() {
    if (!this.#graph) {
      this.#graph = MsGraph.client(this.#auth)
    }
    return this.#graph
  }

  #graph: MsGraphClient | null
  #auth: MsPublicClientApplication
}
