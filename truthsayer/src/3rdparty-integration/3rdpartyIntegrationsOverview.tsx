import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

import { jcss } from 'elementary'

import { OneDriveIntegrationManager } from './OneDriveIntegrationManager'

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
  return (
    <Container className={jcss('d-flex', 'justify-content-center')}>
      <Integration icon="☁" name="OneDrive">
        <OneDriveIntegrationManager />
      </Integration>
    </Container>
  )
}
