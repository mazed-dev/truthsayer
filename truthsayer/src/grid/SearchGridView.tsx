/** @jsxImportSource @emotion/react */
import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { useLocation } from 'react-router-dom'
import { parse } from 'query-string'

import { SearchGrid } from 'elementary'
import { CreateNewNodeMenu } from './CreateNewNodeMenu'
import { MzdGlobalContext } from '../lib/global'
import { NotificationToast, Toast } from '../lib/Toaster'
import { MazedPath } from '../lib/route'
import { ImgButton } from 'elementary'

import lodash from 'lodash'

const Box = styled.div`
  width: 100%;
  max-width: 100%;
`

function CookiePolicyLink({ children }: React.PropsWithChildren<{}>) {
  const href: MazedPath = '/cookie-policy'
  return (
    <a
      href={href}
      css={css`
        display: flex;
        color: black;
        text-decoration: none;
        font-size: 16px;
        margin: auto 8px auto 8px;
        &:hover {
          text-decoration: none;
          color: black;
          opacity: 0.9;
        }
      `}
    >
      {children}
    </a>
  )
}

function CookiePolicyPopUp() {
  const [show, setShow] = React.useState<boolean>(true)
  // TODO(akindyakov): Load user previous choice here
  const accept = () => {
    // TODO(akindyakov): Save user choice here to show not this message on this
    // device anymore
    setShow(false)
  }
  return (
    <Toast show={show}>
      <Toast.Body>
        <strong>🍪</strong> Our website uses cookies to ensure you get the best
        experience on our website.
        <CookiePolicyLink>More info ℹ️ </CookiePolicyLink>
      </Toast.Body>
      <ImgButton onClick={accept}>Ok</ImgButton>
    </Toast>
  )
}

export const SearchGridView = () => {
  const location = useLocation()
  const params = parse(location.search)
  const ctx = React.useContext(MzdGlobalContext)
  React.useEffect(() => {
    ctx.toaster.push(
      <NotificationToast
        title={'Test search grid toast'}
        message={'Message for a test search grid toast'}
        key={'test-test-test'}
      />
    )
    ctx.toaster.push(<CookiePolicyPopUp key={'cookie-policy-notification'} />)
  }, [])
  let { q } = params
  let queryStr: null | string = null
  if (lodash.isArray(q)) {
    queryStr = q.join(' ')
  } else {
    queryStr = q
  }
  return (
    <Box>
      <SearchGrid q={queryStr} defaultSearch />
      <CreateNewNodeMenu />
    </Box>
  )
}
