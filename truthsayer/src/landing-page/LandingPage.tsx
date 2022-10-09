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
        url: '/landing-page',
        entry: '0aae1590707244f5890dfacea2287bc1',
      })
      .promise()
      .then(setBuilderContentJson)
  }, [])
  return <BuilderComponent model="page" content={builderContentJson} />
}
