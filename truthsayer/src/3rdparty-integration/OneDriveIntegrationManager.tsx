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
import { DriveItem as MsGraphDriveItem } from 'microsoft-graph'

import {
  makeNodeTextData,
  NodeExtattrs,
  NodeExtattrsWeb,
  NodeIndexText,
  NodeType,
  smuggler,
} from 'smuggler-api'
import { MdiInsertLink, MdiLinkOff, MdiLaunch } from 'elementary'
import { Mime, log, genOriginId } from 'armoury'
import * as MsGraph from './MicrosoftGraph'
import * as MsAuthentication from './MicrosoftAuthentication'
import { Client as MsGraphClient } from '@microsoft/microsoft-graph-client'
import { Queue } from './FilesystemModificationQueue'
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

async function uploadFilesFromFolder(graph: MsGraphClient, folderPath: string) {
  const fileQueue = await Queue.make({
    graph,
    lastProcessed: new Date(0),
    targetFolderPath: folderPath,
  })
  for (const file of fileQueue.files) {
    if (file.mimeType !== Mime.TEXT_PLAIN) {
      log.debug(
        `Skipping ${file.path} due to unsupported Mime type ${file.mimeType}`
      )
      continue
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

    const response = await smuggler.node.create({
      text: nodeTextData,
      index_text,
      extattrs,
      ntype: NodeType.Url,
      origin: {
        id: await genOriginId(file.webUrl),
      },
    })
    log.debug(`Response to node creation: ${JSON.stringify(response)}`)
  }
}

/** Allows to manage user's integration of Microsoft OneDrive with Mazed */
export function OneDriveIntegrationManager() {
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
            uploadFilesFromFolder(graph, '/mazed-test').catch((error) =>
              console.error(
                `Failed to call Microsoft Graph, error = '${JSON.stringify(
                  error
                )}'`
              )
            )
          }}
        >
          <MdiLaunch />
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
