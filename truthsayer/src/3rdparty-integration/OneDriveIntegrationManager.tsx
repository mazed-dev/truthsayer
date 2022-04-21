/**
 * @file Implements UI widgets that user can use to manage integration between
 * their Mazed & Microsoft OneDrive.
 *
 * On a high level integration with OneDrive consists of two major parts:
 *    1. authentication & authorization (@see setupMsalInstance() )
 *    2. interactions with user data via Microsoft Graph to on behalf of an
 *      authenticated Microsoft account (@see graph() )
 */

// Significant chunk of the code for integration with OneDrive was taken from
// https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react
import styled from '@emotion/styled'

import { PublicClientApplication, PopupRequest } from '@azure/msal-browser'
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react'

import {
  makeNodeTextData,
  NodeExtattrs,
  NodeIndexText,
  NodeType,
  smuggler,
  UserFilesystemId,
  AccountInterface,
} from 'smuggler-api'
import { MdiInsertLink, MdiLinkOff, MdiSync } from 'elementary'
import { Mime, log, genOriginId, errorise } from 'armoury'
import * as MsGraph from './MicrosoftGraph'
import * as MsAuthentication from './MicrosoftAuthentication'
import { Client as MsGraphClient } from '@microsoft/microsoft-graph-client'
import * as FsModificationQueue from './FilesystemModificationQueue'

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;

  vertical-align: middle;
  &:hover {
    background-color: #d0d1d2;
  }
`

async function signIn(msalApp: PublicClientApplication) {
  const loginRequest: PopupRequest = {
    // Below is the list of Microsoft Graph scopes the client application
    // will ask authorization for. User will need to explicitely consent.
    scopes: MsGraph.scopes(['User.Read', 'Files.Read']),
  }
  return msalApp.loginPopup(loginRequest)
}

async function signOut(msalApp: PublicClientApplication) {
  return msalApp.logoutPopup({
    mainWindowRedirectUri: '/',
  })
}

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

async function uploadFilesFromFolder(
  graph: MsGraphClient,
  account: AccountInterface,
  folderPath: string
) {
  const fsid: UserFilesystemId = {
    uid: account.getUid(),
    fs_key: 'onedrive',
  }
  const current_progress = await smuggler.user.thirdparty.fs.progress.get(fsid)
  const files = await FsModificationQueue.make(
    graph,
    current_progress.ingested_until,
    folderPath
  )
  for (const batch of FsModificationQueue.modTimestampBatchIterator(files)) {
    for (const file of batch) {
      await uploadSingleFile(graph, file)
    }
    await smuggler.user.thirdparty.fs.progress.advance(fsid, {
      ingested_until: batch[0].lastModTimestamp,
    })
  }
}

async function uploadSingleFile(
  graph: MsGraphClient,
  file: FsModificationQueue.FileProxy
) {
  if (file.mimeType !== Mime.TEXT_PLAIN) {
    log.debug(
      `Skipping ${file.path} due to unsupported Mime type ${file.mimeType}`
    )
    return
  }

  const stream: ReadableStream = await graph
    .api(`/me/drive/items/${file.id}/content`)
    .getStream()

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

/** Allows to manage user's integration of Microsoft OneDrive with Mazed */
export function OneDriveIntegrationManager({
  account,
}: {
  account: AccountInterface
}) {
  const msAuthentication = MsAuthentication.makeInstance()
  return (
    // Having MsalProvider as parent grants all children access to
    // '@azure/msal-react' context, hooks and components
    <MsalProvider instance={msAuthentication}>
      {/* Pair of AuthenticatedTemplate and UnauthenticatedTemplate
      render their children conditionally - first if the user has logged in
      to a Microsoft account, second one if they didn't*/}
      <AuthenticatedTemplate>
        <Button
          onClick={() => {
            signOut(msAuthentication)
          }}
        >
          <MdiLinkOff />
        </Button>
        <Button
          onClick={() => {
            const graph: MsGraphClient = MsGraph.client(msAuthentication)
            uploadFilesFromFolder(graph, account, '/mazed-test').catch(
              (exception) =>
                log.exception(
                  errorise(exception),
                  `Failed to call Microsoft Graph`
                )
            )
          }}
        >
          <MdiSync />
        </Button>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Button
          onClick={() => {
            signIn(msAuthentication)
          }}
        >
          <MdiInsertLink />
        </Button>
      </UnauthenticatedTemplate>
    </MsalProvider>
  )
}
