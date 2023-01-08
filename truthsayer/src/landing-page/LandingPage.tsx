/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { Button, Form } from 'react-bootstrap'
import { kMazedDescription } from './../AppHead'
import { routes } from './../lib/route'

const SlidesBox = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: auto;
  scroll-snap-type: y mandatory;

  font-family: 'Roboto', arial, sans-serif;
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

const VerticalSplit = styled.div`
  display: flex;
  justify-content: flex-start;
`
const VerticalSplitHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 100%;
  }
`
const VerticalSplitHalfWideScreenOnly = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 0%;
    display: none;
  }
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
  max-width: 42em;
`

const Logo = styled.div`
  font-family: 'Comfortaa';
  font-size: 32px;
`
const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 22px 5px 22px;
`
const LoginBox = styled.div`
  padding: 2px;
`
const LoginBtn = styled(Button)`
  background-color: white;
  border-color: white;
`
function Login() {
  return (
    <LoginBox>
    <LoginBtn
      variant="light"
      href={routes.login}
      size="lg"
    >
      Log In
    </LoginBtn></LoginBox>
  )
}
const DemoGifPlaceholder = styled.div`
  width: 400px;
  height: 400px;
  background: #cccccc;
`
const SignUpFormBox = styled.div`
  margin-top: 20px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  width: 100%;
  flex-wrap: nowrap;
  font-size: 18px;
  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`
const SignUpBtn = styled(Button)`
  white-space: nowrap;
  border-radius: inherit;
  font-size: inherit;
  margin: 1em 2px 1px 1px;
`
const SignUpEmail = styled(Form.Control)`
  width: 60%;
  max-width: 18em;
  border-radius: inherit;
  font-size: inherit;
  margin: 1em 2px 1px 1px;
`

const LandingFooter = styled.div``
const SubscriptionComment  = styled.div`
`

export function LandingPage() {
  return (
    <SlidesBox>
      <Slide>
        <Topbar>
          <Logo>🧵 Mazed</Logo>
          <Login/>
        </Topbar>
        <VerticalSplit>
          <VerticalSplitHalf>
            <SignUpFormBox>
              <SignUpEmail type="email"/>
              <SignUpBtn
                variant="outline-primary"
                href={routes.signup}
                size="lg"
              >
                Get early access
              </SignUpBtn>
            </SignUpFormBox>
            <SubscriptionComment>
              Mazed doesn't sell data.
              Mazed makes money off subscriptions.
            </SubscriptionComment>
          </VerticalSplitHalf>
          <VerticalSplitHalfWideScreenOnly>
            <Centered>
              <DemoGifPlaceholder />
            </Centered>
          </VerticalSplitHalfWideScreenOnly>
        </VerticalSplit>
      </Slide>
      <Slide>
        <Centered>
          <Title>Mazed</Title>
        </Centered>
        <Centered>
          <Description>🧵 {kMazedDescription}</Description>
        </Centered>
        <Centered>
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
              margin-top: 18vh;
            `}
          >
            Information from the odd Twitter tread, a half-read article, some
            newsletter, and a YouTube video are all carefully recorded and
            connected, blended into a clever cocktail of insights 🍸
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
        </Centered>
        <LandingFooter />
      </Slide>
    </SlidesBox>
  )
}
