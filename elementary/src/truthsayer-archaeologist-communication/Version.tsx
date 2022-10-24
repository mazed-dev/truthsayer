import React from 'react'

import { MimeType, log } from 'armoury'

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
  const id: VersionId = 'mazed-archaeologist-version'
  return <Version id={id} version={version} />
}

export function TruthsayerVersion({ version }: { version: VersionStruct }) {
  const id: VersionId = 'mazed-truthsayer-version'
  return <Version id={id} version={version} />
}

export function getArchaeologistVersion(
  document_: Document
): VersionStruct | null {
  const id: VersionId = 'mazed-archaeologist-version'
  const el = document_.getElementById(id)
  if (el != null) {
    try {
      return JSON.parse(el.innerHTML) as VersionStruct
    } catch (err) {
      log.error('Archaeologist version deserialization failed with', err)
    }
  }
  return null
}
