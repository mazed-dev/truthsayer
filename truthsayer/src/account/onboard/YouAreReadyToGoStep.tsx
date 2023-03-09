/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

const Box = styled.div`
  padding: 18px;

  display: flex;
  justify-content: center;
  align-items: center;
`

const DescriptionBox = styled.div``
const DescriptionList = styled.ul``
const DescriptionListItem = styled.li`
  list-style-type: '🚀';
  padding-left: 12px;
`

export const YouAreReadyToGoStep = () => {
  return (
    <Box>
      <DescriptionBox>
        <DescriptionList>
          <DescriptionListItem>
            Browse the internet as you normally do. Mazed saves everything you
            read, automatically, in your own private, local storage.
          </DescriptionListItem>
          <DescriptionListItem>
            Use enything you've read, without searching for it. Mazed overlays
            your existing workflows and serves you your relevant information,
            exactly when you need it.
          </DescriptionListItem>
          <DescriptionListItem>
            Book a call with our founders, to provide feedback and make special
            requests:{' '}
            <a href="https://calendly.com/grahamgrieve/30min">
              https://calendly.com/grahamgrieve
            </a>
          </DescriptionListItem>
        </DescriptionList>
      </DescriptionBox>
    </Box>
  )
}
