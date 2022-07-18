import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import styled from '@emotion/styled'

import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react'

import {
  MdiInsertLink,
  MdiLinkOff,
  jcss,
  MdiSync,
  MdiCloudSync,
} from 'elementary'
import { errorise, genOriginId, log, Mime } from 'armoury'
import {
  AccountInterface,
  CreateNodeArgs,
  smuggler,
  steroid,
  UserFilesystemId,
  NodeType,
  makeNodeTextData,
} from 'smuggler-api'

import { MzdGlobalContext } from '../lib/global'
import * as MsAuthentication from './MicrosoftAuthentication'
import { OneDriveFs } from './OneDriveFilesystem'
import { extattrsFromFile } from './3rdPartyFilesystemProxyUtil'
import { ThirdpartyFs } from './3rdPartyFilesystem'
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

type IntegrationProps = React.PropsWithChildren<{
  icon: string
  name: string
}>

function Integration({ icon, name, children }: IntegrationProps) {
  return (
    <Row>
      <Col>{icon}</Col>
      <Col>{name}</Col>
      <Col>{children}</Col>
    </Row>
  )
}

async function uploadFilesFromFolder(
  fs: ThirdpartyFs,
  fsid: UserFilesystemId,
  folderPath: string,
  progressUpdateCallback: (filesToUploadLeft: number) => void
) {
  const current_progress = await smuggler.thirdparty.fs.progress.get(fsid)
  const files = await FsModificationQueue.make(
    fs,
    current_progress.ingested_until,
    folderPath
  )
  progressUpdateCallback(files.length)
  let filesLeft = files.length
  for (const batch of FsModificationQueue.modTimestampBatchIterator(files)) {
    for (const file of batch) {
      if (!steroid.build_index.cfg.supportsMime(file.details.mimeType)) {
        log.debug(
          `Skipping ${file.path} due to unsupported Mime type ${file.details.mimeType}`
        )
        return
      }
      const contents: File = await fs.download(file)
      const index_text = await steroid.build_index.build(contents)
      const extattrs = await extattrsFromFile(file, contents)
      const origin = await genOriginId(file.webUrl)
      const node: CreateNodeArgs = {
        text: makeNodeTextData(),
        index_text,
        extattrs,
        ntype: NodeType.Url,
        origin: {
          id: origin.id,
        },
      }

      const response = await smuggler.node.createOrUpdate(node)
      log.debug(`Response to node creation/update: ${JSON.stringify(response)}`)
    }
    await smuggler.user.thirdparty.fs.progress.advance(fsid, {
      ingested_until: batch[0].lastModTimestamp,
    })
    filesLeft -= batch.length
    progressUpdateCallback(filesLeft)
  }
}

/**
 * Implements UI widgets that user can use to manage integration between
 * their Mazed & Microsoft OneDrive.
 *
 * On a high level integration with OneDrive consists of two major parts:
 *    1. authentication & authorization (@see setupMsalInstance() )
 *    2. interactions with user data via Microsoft Graph to on behalf of an
 *      authenticated Microsoft account (@see graph() )
 */
export function OneDriveIntegrationManager({
  account,
}: {
  account: AccountInterface
}) {
  // Significant chunk of the code for integration with OneDrive was taken from
  // https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react
  const [msAuthentication] = React.useState(MsAuthentication.makeInstance())
  const [oneDriveFs] = React.useState(new OneDriveFs(msAuthentication))
  const [oneDriveUploadCounter, setOneDriveUploadCounter] = React.useState(0)

  const oneDriveSyncButton =
    oneDriveUploadCounter === 0 ? (
      <MdiSync /> // This icon is intended to invite user to initiate a new sync attempt
    ) : (
      <MdiCloudSync />
    ) // This icon is intended to show a user that sync is already in progress

  const oneDriveFsid: UserFilesystemId = {
    fs_key: 'onedrive',
  }
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
            oneDriveFs.signOut()
          }}
        >
          <MdiLinkOff />
        </Button>
        <Button
          onClick={() => {
            uploadFilesFromFolder(
              oneDriveFs,
              oneDriveFsid,
              '/mazed-test',
              setOneDriveUploadCounter
            )
              .catch((exception) => {
                log.exception(
                  errorise(exception),
                  `Failed to call Microsoft Graph`
                )
              })
              .finally(() => setOneDriveUploadCounter(0))
          }}
        >
          {oneDriveSyncButton}
          {oneDriveUploadCounter > 0 ? oneDriveUploadCounter : null}
        </Button>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Button
          onClick={() => {
            oneDriveFs.signIn()
          }}
        >
          <MdiInsertLink />
        </Button>
      </UnauthenticatedTemplate>
    </MsalProvider>
  )
}

export function IntegrationsOverview() {
  const ctx = React.useContext(MzdGlobalContext)
  const account = ctx.account
  if (!account) {
    throw Error(
      'Thirdparty integrations require a valid Mazed account available'
    )
  }
  return (
    <Container className={jcss('d-flex', 'justify-content-center')}>
      <Integration icon="☁" name="OneDrive (only /mazed-test folder)">
        <OneDriveIntegrationManager account={account} />
      </Integration>
    </Container>
  )
}
