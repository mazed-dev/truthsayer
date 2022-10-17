import React from 'react'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'

import { kCardBorder } from 'elementary'
import GoogleChromeLogo from './img/GoogleChromeLogo.svg'

type MazedAppLinks =
  | 'https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc'

const kGoogleChromeStoreLink: MazedAppLinks =
  'https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc'

const Name = styled.div`
  font-size: 16px;
  margin: 10px;
`
const Box = styled(Container)`
  padding: 18px;
  height: 200px;
`

const AppItem = styled.a`
  display: flex;
  justify-content: left;
  align-items: center;
  color: inherit;
  text-decoration: none;

  border-radius: 8px;
  ${kCardBorder};
  margin: 0 0 8px 0;
  padding: 10px;
`

const Logo = styled.img`
  width: 52px;
  height: 52px;
`

export function AppsList({ className }: { className?: string }) {
  return (
    <Box className={className}>
      <AppItem href={kGoogleChromeStoreLink}>
        <Logo src={GoogleChromeLogo} />
        <Name>Mazed for Chrome</Name>
      </AppItem>
    </Box>
  )
}
