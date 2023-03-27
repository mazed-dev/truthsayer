/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react'

import { MdiInsertLink, MdiLinkOff, MdiSync, MdiCloudSync } from 'elementary'
import { errorise, genOriginId, log } from 'armoury'
import {
  NodeCreateArgs,
  steroid,
  UserExternalPipelineId,
  NodeType,
  makeEmptyNodeTextData,
  NodeExtattrs,
  StorageApi,
} from 'smuggler-api'

import { MzdGlobalContext } from '../../lib/global'
import * as MsAuthentication from './MicrosoftAuthentication'
import { OneDriveFs } from './OneDriveFilesystem'
import { extattrsFromFile } from './3rdPartyFilesystemProxyUtil'
import { ThirdpartyFs } from './3rdPartyFilesystem'
import * as FsModificationQueue from './FilesystemModificationQueue'

import MicrosoftOfficeOneDriveLogoImg from './img/Microsoft-Office-OneDrive-logo-2019.svg'
export { MicrosoftOfficeOneDriveLogoImg }

const Box = styled.div``
const BoxButtons = styled.div``
const Title = styled.div`
  margin-bottom: 10px;
`

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

async function uploadFilesFromFolder(
  fs: ThirdpartyFs,
  epid: UserExternalPipelineId,
  folderPath: string,
  storage: StorageApi,
  progressUpdateCallback: (filesToUploadLeft: number) => void
) {
  const current_progress = await storage.external.ingestion.get({ epid })
  const files = await FsModificationQueue.make(
    fs,
    current_progress.ingested_until,
    folderPath
  )
  progressUpdateCallback(files.length)
  let filesLeft = files.length
  for (const batch of FsModificationQueue.modTimestampBatchIterator(files)) {
    for (const file of batch) {
      if (
        !steroid(storage).build_index.cfg.supportsMime(file.details.mimeType)
      ) {
        log.debug(
          `Skipping ${file.path} due to unsupported Mime type ${file.details.mimeType}`
        )
        return
      }
      const contents: File = await fs.download(file)
      const index_text = await steroid(storage).build_index.build(contents)
      const extattrs: NodeExtattrs = {
        ...(await extattrsFromFile(file, contents)),
      }
      const origin = genOriginId(file.webUrl)
      const node: NodeCreateArgs = {
        text: makeEmptyNodeTextData(),
        index_text,
        extattrs,
        ntype: NodeType.Url,
        origin: {
          id: origin.id,
        },
        created_via: { autoIngestion: epid },
      }

      const response = await steroid(storage).node.createOrUpdate(node)
      log.debug(`Response to node creation/update: ${JSON.stringify(response)}`)
    }
    await storage.external.ingestion.advance({
      epid,
      new_progress: {
        ingested_until: batch[0].lastModTimestamp,
      },
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
  className,
  onFinish,
}: {
  className?: string
  onFinish?: () => void
}) {
  // Significant chunk of the code for integration with OneDrive was taken from
  // https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react
  const [msAuthentication] = React.useState(MsAuthentication.makeInstance())
  const [oneDriveFs] = React.useState(new OneDriveFs(msAuthentication))
  const [oneDriveUploadCounter, setOneDriveUploadCounter] = React.useState(0)
  const ctx = React.useContext(MzdGlobalContext)

  const oneDriveSyncButton =
    oneDriveUploadCounter === 0 ? (
      <MdiSync /> // This icon is intended to invite user to initiate a new sync attempt
    ) : (
      <MdiCloudSync />
    ) // This icon is intended to show a user that sync is already in progress

  const oneDriveFsid: UserExternalPipelineId = {
    pipeline_key: 'onedrive',
  }
  return (
    // Having MsalProvider as parent grants all children access to
    // '@azure/msal-react' context, hooks and components
    <Box className={className}>
      <Title>
        OneDrive (only <code>/mazed-test</code> folder)
      </Title>
      <BoxButtons>
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
                  ctx.storage,
                  setOneDriveUploadCounter
                )
                  .catch((exception) => {
                    log.exception(
                      errorise(exception),
                      `Failed to call Microsoft Graph`
                    )
                  })
                  .finally(() => {
                    setOneDriveUploadCounter(0)
                    onFinish?.()
                  })
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
              <MdiInsertLink
                css={css`
                  vertical-align: middle;
                `}
              />{' '}
              Sync
            </Button>
          </UnauthenticatedTemplate>
        </MsalProvider>
      </BoxButtons>
    </Box>
  )
}

export function MicrosoftOfficeOneDriveImporter({
  className,
  onFinish,
}: {
  className?: string
  onFinish?: () => void
}) {
  const ctx = React.useContext(MzdGlobalContext)
  const account = ctx.account
  if (!account) {
    throw Error(
      'Microsoft Office OneDrive integration requires a valid Mazed account available'
    )
  }
  return (
    <OneDriveIntegrationManager className={className} onFinish={onFinish} />
  )
}
