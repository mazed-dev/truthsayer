import React from 'react'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'

import { jcss, MdiLaunch } from 'elementary'

import { Emoji } from '../lib/Emoji'

import { OneDriveIntegrationManager } from './OneDriveIntegrationManager'
import { MzdGlobalContext } from '../lib/global'

const Line = styled.div`
  display: flex;
  justify-content: start;
  margin-top: 12px;
`
const Name = styled.div`
  font-size: 16px;
  margin: 0 10px 0 0;
`
const ExtLinkIcon = styled(MdiLaunch)`
  font-size: 18px;
  vertical-align: middle;
  padding: 4px;
`
const ExtLink = styled.a`
  color: black;
  cursor: pointer;
  border-radius: 32px;

  &:hover {
    color: black;
    text-decoration: none;
    background-color: #d0d1d2;
  }
`

const Box = styled(Container)`
  padding: 18px 0 0 12px;
`

export function IntegrationsOverview() {
  const ctx = React.useContext(MzdGlobalContext)
  const account = ctx.account
  if (!account) {
    throw Error(
      'Thirdparty integrations require a valid Mazed account available'
    )
  }
  return (
    <Box className={jcss('justify-content-center')}>
      <Line>
        <Name>
          <Emoji symbol="☁" /> OneDrive sync
        </Name>
        <OneDriveIntegrationManager account={account} />
      </Line>
      <Line>
        <Name>Mazed for Chrome</Name>
        <ExtLink href="https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc">
          <ExtLinkIcon />
        </ExtLink>
      </Line>
    </Box>
  )
}
