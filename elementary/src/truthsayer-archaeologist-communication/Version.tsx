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

/**
 * Compare two version strings in semver format and return true if first input
 * argument has a greater version than the second one or the same.
 */
export function lhsSemverIsGreaterOrEqual(lhs: string, rhs: string) {
  // Implementation based on https://stackoverflow.com/a/55466325/3375765
  const res = lhs.localeCompare(rhs, undefined, { numeric: true })
  return res === 1 || res === 0
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
