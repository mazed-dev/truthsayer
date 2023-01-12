/** @jsxImportSource @emotion/react */

import React, { useState, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { Button, Form } from 'react-bootstrap'
import { goto, routes } from './../lib/route'
import DemoQuoteImg from './img/copy-quote-demo.png'
import DemoWritingAugmentationGif from './img/mazed-demo-writing-augmentation-safes.gif'

import { authentication } from 'smuggler-api'
import { log } from 'armoury'

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

const FirstSlideBody = styled.div`
  display: flex;
  justify-content: flex-start;
  height: 88vh;
`
const FirstSlideLeftHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 100%;
  }

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;

  padding: 42px;
`
const FirstSlideRightHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 0%;
    display: none;
  }
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;
`
const SecondSlideBody = styled.div`
  display: flex;
  justify-content: flex-start;
  padding-top: 8vh;
`
const SecondSlideRightHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 100%;
  }

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;
`
const SecondSlideLeftHalf = styled.div`
  width: 50%;
  @media (max-width: 900px) {
    width: 0%;
    display: none;
  }

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;

  padding: 42px;
`
const Header = styled.h1`
  font-size: 32px;
  text-align: center;
`
const Description = styled.h2`
  font-size: 18px;
  text-align: center;
  margin: 3vh 12px 0 12px;
`

const Logo = styled.div`
  font-family: 'Comfortaa';
  font-size: 32px;
`
const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px;
`
const LoginBox = styled.div``
const BtnBox = styled(Button)`
  background-color: white;
  border-color: white;
`
function Btn({
  href,
  children,
  className,
}: React.PropsWithChildren<{ href: string; className?: string }>) {
  return (
    <BtnBox variant="light" href={href} className={className}>
      {children}
    </BtnBox>
  )
}
function Login() {
  return (
    <LoginBox>
      <Btn href={routes.login}>Log In</Btn>
    </LoginBox>
  )
}
const ImageDemo = styled.img`
  width: 60vmin;
  height: 60vmin;

  border-color: #cecece;
  border-style: solid;
  box-shadow: 2px 2px 4px #8c8c8ceb;
`
const SignUpFormBox = styled.form`
  margin-top: 14vh;
  border-radius: 10px;
  width: 100%;
  font-size: 18px;

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;

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

const SignUpForm = () => {
  const [email, setEmail] = useState<string>('')
  const emailElementRef = useRef<HTMLInputElement>(null)
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }
  const history = useHistory()
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    authentication.user
      .register({
        name: email.split('@')[0],
        email: email,
      })
      .catch((err) => {
        log.error('User registration failed with', err)
      })
      .then((res) => {
        if (res) {
          goto.notice.youAreInWaitingList(history, {
            name: email.split('@')[0],
            email: email,
          })
        }
      })
  }
  return (
    <SignUpFormBox onSubmit={handleSubmit}>
      <SignUpEmail
        type="email"
        placeholder="email"
        onChange={onChange}
        value={email}
        ref={emailElementRef}
      />
      <SignUpBtn
        variant="outline-primary"
        size="lg"
        type="submit"
        disabled={!emailElementRef.current?.validity.valid}
      >
        Get early access
      </SignUpBtn>
    </SignUpFormBox>
  )
}

const LastSlide = styled(Slide)`
  position: relative;
`

const Footer = styled.div`
  width: 100%;
  position: absolute;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: space-around;
  justify-content: center;
  padding: 16px;
`

const FooterCol = styled.div`
  text-align: left;
  width: 250px;
`
const FooterItem = styled.div`
  font-sixe: 16px;
`

const TextStrikeThrough = styled.span`
  text-decoration: line-through;
  text-decoration-color: blue;
`
const TextHighlight = styled.span`
  font-weight: 900;
  color: blue;
`

export function LandingPage() {
  return (
    <SlidesBox>
      <Slide>
        <Topbar>
          <Logo>🧵 Mazed</Logo>
          <Login />
        </Topbar>
        <FirstSlideBody>
          <FirstSlideLeftHalf>
            <Header>
              <div>Share any page you've read.</div>
              <div>
                <b>Without searching for it.</b>
              </div>
            </Header>
            <Description>
              Mazed is a browser extension that saves the pages you view
              automatically, and resurfaces them to you when you need it. Your
              memory, at your fingertips.
            </Description>
            <SignUpForm />
          </FirstSlideLeftHalf>
          <FirstSlideRightHalf>
            <Centered>
              <ImageDemo src={DemoWritingAugmentationGif} />
            </Centered>
          </FirstSlideRightHalf>
        </FirstSlideBody>
      </Slide>
      <Slide>
        <SecondSlideBody>
          <SecondSlideRightHalf>
            <Centered>
              <ImageDemo src={DemoQuoteImg} />
            </Centered>
          </SecondSlideRightHalf>
          <SecondSlideLeftHalf>
            <Header>
              <TextStrikeThrough>Find </TextStrikeThrough>
              <TextHighlight>Have</TextHighlight> what you need.
            </Header>
            <Description>
              The article, page, or google doc you need is just a click away.
              Mazed will suggest the relevant pages from your history to you, as
              you type.
            </Description>
          </SecondSlideLeftHalf>
        </SecondSlideBody>
      </Slide>
      <LastSlide>
        <Centered>
          <SignUpForm />
        </Centered>
        <Footer>
          <FooterCol>
            <Logo>Mazed</Logo>
          </FooterCol>
          <FooterCol>
            <FooterItem>
              <Btn href={routes.login}>Log In</Btn>
            </FooterItem>
            <FooterItem>
              <Btn
                href={
                  'https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc'
                }
              >
                Download
              </Btn>
            </FooterItem>
            <FooterItem>
              <Btn href={routes.terms}>Terms and Conditions</Btn>
            </FooterItem>
            <FooterItem>
              <Btn href={routes.privacy}>Privacy Policy</Btn>
            </FooterItem>
            <FooterItem>
              <Btn href={routes.cookiePolicy}>Cookie Policy</Btn>
            </FooterItem>
          </FooterCol>
          <FooterCol>
            <FooterItem>
              <Btn href={'https://mazed.se'}>mazed.se</Btn>
            </FooterItem>
            <FooterItem>
              <Btn href={'mailto: mazed@fastmail.com'}>mazed@fastmail.com</Btn>
            </FooterItem>
          </FooterCol>
        </Footer>
      </LastSlide>
    </SlidesBox>
  )
}
