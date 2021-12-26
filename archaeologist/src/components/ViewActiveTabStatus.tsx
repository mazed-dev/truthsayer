/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import { SavePageButton } from './SavePageButton'

import { Relative, HVCentered } from './../util/layout'

const LogoBackImg = styled.img`
  margin: 0;
  padding: 0;
  opacity: 0.25;
  width: 72px;
`

const Container = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: block;
`
const Shifted = styled.div`
  margin-top: 169px;
`

export const ViewActiveTabStatus = () => {
  return (
    <Container>
      <Relative>
        <HVCentered>
          <LogoBackImg src="/logo-fade-72x72.png" />
        </HVCentered>
      </Relative>
      <Relative>
        <HVCentered>
          <Shifted>
            <SavePageButton />
          </Shifted>
        </HVCentered>
      </Relative>
    </Container>
  )
}
