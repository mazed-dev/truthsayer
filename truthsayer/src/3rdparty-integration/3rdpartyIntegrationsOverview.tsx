import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

import { jcss } from 'elementary'

import { OneDriveIntegrationManager } from './OneDriveIntegrationManager'
import { MzdGlobalContext } from '../lib/global'
import { assert } from 'console'

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
