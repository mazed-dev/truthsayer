/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { Button } from 'react-bootstrap'
import { kMazedDescription } from './ProductMetaTags'
import { LandingFooter } from './LandingFooter'
import { routes } from './../lib/route'

const SlidesBox = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: auto;
  scroll-snap-type: y mandatory;

  font-family: 'Comfortaa';
  font-size: 22px;
`

const Slide = styled.div`
  width: 100vw;
  height: 100vh;

  scroll-snap-align: start;
`

const Centered = styled.div`
  display: flex;
  justify-content: center;
`

const Title = styled.h1`
  font-size: 48px;
  text-align: center;
  margin-top: 18vh;
`
const Description = styled.h2`
  font-size: 22px;
  text-align: center;
  margin: 3vh 12px 0 12px;
`

const Snippet = styled(Description)`
  width: 80vw;
`

const Topbar = styled.div`
  display: flex;
  justify-content: right;
  padding: 5px 22px 5px 22px;
`
function LoginButton() {
  return (
    <Button
      variant="outline-dark"
      href={routes.login}
      size="lg"
      css={css`
        font-size: 18px;
      `}
    >
      Log in
    </Button>
  )
}
function SignUpButton() {
  return (
    <Button
      variant="outline-dark"
      href={routes.signup}
      css={css`
        font-size: 18px;
        margin-top: 3vh;
      `}
      size="lg"
    >
      Sign up
    </Button>
  )
}

export function LandingPage() {
  return (
    <SlidesBox>
      <Slide>
        <Topbar>
          <LoginButton />
        </Topbar>
        <Centered>
          <Title>Mazed</Title>
        </Centered>
        <Centered>
          <Description>🧵 {kMazedDescription}</Description>
        </Centered>
        <Centered>
          <SignUpButton />
        </Centered>
      </Slide>
      <Slide
        css={css`
          position: relative;
        `}
      >
        <Centered>
          <Snippet
            css={css`
              margin-top: 22vh;
            `}
          >
            Information from the odd Twitter tread, a half-read article, some
            newsletter and YouTube video are all carefully recorded and
            connected, mixed into a clever cocktail of insights 🍸
          </Snippet>
        </Centered>
        <Centered>
          <Snippet
            css={css`
              margin-top: 5vh;
            `}
          >
            Mazed helps you to remember everything about everything 💡
          </Snippet>
        </Centered>
        <Centered>
          <SignUpButton />
        </Centered>
        <LandingFooter />
      </Slide>
    </SlidesBox>
  )
}
