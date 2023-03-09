import React from 'react'
import { Container } from 'react-bootstrap'
import styled from '@emotion/styled'

import { kCardBorder, Spinner } from 'elementary'
import GoogleChromeLogo from './img/GoogleChromeLogo.svg'
import { ArchaeologistState } from './archaeologistState'
import { Button } from 'react-bootstrap'

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
`

const DescriptionBox = styled.div``
const DescriptionList = styled.ul``
const DescriptionListItem = styled.li`
  list-style-type: '✅';
  padding-left: 12px;
`
const AppsBox = styled.div``
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

function describe(state: ArchaeologistState) {
  switch (state.state) {
    case 'loading': {
      return <Spinner.Ring />
    }
    case 'installed': {
      return <Button disabled>Installed</Button>
    }
    case 'not-installed': {
      return <Button href={kGoogleChromeStoreLink}>Install</Button>
    }
  }
}

export function AppsList({
  archaeologist,
  className,
}: {
  archaeologist: ArchaeologistState
  className?: string
}) {
  return (
    <Box className={className}>
      <DescriptionBox>
        <DescriptionList>
          <DescriptionListItem>
            <b>Instant.</b> Mazed allows you reference anything you've read,
            without searching for it.
          </DescriptionListItem>
          <DescriptionListItem>
            <b>Automatic.</b> Mazed helps you remember everything you read,
            automatically.
          </DescriptionListItem>
          <DescriptionListItem>
            <b>Private.</b> Nothing you read or write leaves your device, with
            local storage.
          </DescriptionListItem>
        </DescriptionList>
      </DescriptionBox>
      <AppsBox>
        <AppItem href={kGoogleChromeStoreLink}>
          <Logo src={GoogleChromeLogo} />
          <Name>Mazed for Chrome &mdash; {describe(archaeologist)}</Name>
        </AppItem>
      </AppsBox>
    </Box>
  )
}
