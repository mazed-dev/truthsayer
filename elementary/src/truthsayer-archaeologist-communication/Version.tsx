import React from 'react'

import { MimeType } from 'armoury'

export type VersionId =
  | 'mazed-archaeologist-version'
  | 'mazed-truthsayer-version'

export type VersionStruct = {
  version: string
  // uid: string
  // ...
}

export function Version({
  id,
  version,
}: {
  id: VersionId
  version: VersionStruct
}) {
  return (
    <script type={MimeType.JSON} id={id}>
      {JSON.stringify(version)}
    </script>
  )
}

export function ArchaeologistVersion({ version }: { version: VersionStruct }) {
  return <Version id={'mazed-archaeologist-version'} version={version} />
}

export function TruthsayerVersion({ version }: { version: VersionStruct }) {
  return <Version id={'mazed-truthsayer-version'} version={version} />
}
