import React from 'react'
import { BuilderComponent, builder } from '@builder.io/react'

builder.init('0472fab3b2de47449c0ac0d0bd8d15b0')

// Disable builder cookies for GDPR Compliance
// https://forum.builder.io/t/gdpr-compliance/292/6
//
// If changed, don't forget to update Cookie Policy document
// legal/cookie-policy.md
builder.canTrack = false

export const LandingPage = () => {
  const [builderContentJson, setBuilderContentJson] = React.useState<any>(null)
  React.useEffect(() => {
    builder
      .get('page', {
        entry: '3c6590b8ee4e4c05a67d391ed6c7b16d',
      })
      .promise()
      .then(setBuilderContentJson)
  }, [])
  return <BuilderComponent model="page" content={builderContentJson} />
}
