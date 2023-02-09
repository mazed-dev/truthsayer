/** @jsxImportSource @emotion/react */

import React, { useState, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { Form } from 'react-bootstrap'

import { goto, routes } from './../lib/route'
import { getLogoImage } from './../util/env'

import { authentication } from 'smuggler-api'
import { log, MimeType } from 'armoury'

import {
  Linkedin as LinkedinLogo,
  Google as GoogleLogo,
  Salesforce as SalesforceLogo,
} from '@emotion-icons/fa-brands'

const SlidesBox = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: auto;
  scroll-snap-type: y mandatory;

  font-family: 'Roboto', arial, sans-serif;
  font-size: 22px;

  color: ${(props) => props.theme.color.primary};
  background-color: ${(props) => props.theme.backgroundColor.primary};
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
  width: 100%;

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;

  padding: 20px;
`
const Header = styled.h1`
  font-size: 48px;
  @media (max-width: 800px) {
    font-size: 36px;
  }
  @media (max-width: 600px) {
    font-size: 32px;
  }
  text-align: center;
`
const Description = styled.h2`
  font-size: 28px;
  @media (max-width: 800px) {
    font-size: 20px;
  }
  @media (max-width: 600px) {
    font-size: 16px;
  }
  text-align: center;
  margin-top: 40px;
`
const Comment = styled.h2`
  font-size: 14px;
  @media (max-width: 800px) {
    font-size: 13px;
  }
  @media (max-width: 600px) {
    font-size: 12px;
  }
  text-align: center;
  margin-top: 8vh;
`
const TrustedByBox = styled.div``
const TrustedByTitle = styled(Comment)``
const TrustedByLogosBox = styled.div`
  font-size: 48px;
  @media (max-width: 800px) {
    font-size: 36px;
  }
  @media (max-width: 600px) {
    font-size: 32px;
  }
  display: flex;
  justify-content: center;
  gap: 0.8em;
  margin-top: 12px;
`

const Logo = styled.div`
  font-family: 'Comfortaa';
  font-weight: 900;
  font-size: 32px;
  @media (max-width: 800px) {
    font-size: 28px;
  }
  cursor: pointer;
  color: white;
  &:hover {
    border: none;
    background-color: ${(props) => props.theme.backgroundColor.primary};
  }
`

const LogoImg = styled.img`
  filter: invert(1);
  width: 38px;
  height: 38px;
  margin-bottom: 8px;
`
const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px;
`
const LoginBox = styled.div`
  margin-right: 16px;
`
const RefBtnBox = styled.a`
  background-color: white;
  border-color: white;

  font-size: 16px;
  text-decoration: none;

  background-color: ${(props) => props.theme.backgroundColor.primary};
  color: ${(props) => props.theme.color.primary};
  border: none;

  &:hover {
    border: none;
    background-color: ${(props) => props.theme.backgroundColor.primary};
    color: ${(props) => props.theme.color.positive};
  }
`
function RefBtn({
  href,
  children,
  className,
}: React.PropsWithChildren<{ href: string; className?: string }>) {
  return (
    <RefBtnBox href={href} className={className}>
      {children}
    </RefBtnBox>
  )
}
function Login() {
  return (
    <LoginBox>
      <RefBtn href={routes.login}>Log In</RefBtn>
    </LoginBox>
  )
}

// const ImageDemo = styled.img`
//   height: 86vh;
//   border-color: #cecece;
//   border-style: solid;
//   box-shadow: 1px 1px 4px ${(props) => props.theme.backgroundColor.negative};
//   filter: ${(props) => props.theme.image.filter};
// `

const SignUpFormBox = styled.form`
  border-radius: 10px;
  width: 100%;
  font-size: 16px;

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
  margin: 12px 0 0 0;
`
const SignUpBtn = styled.button`
  white-space: nowrap;
  cursor: pointer;
  font-size: inherit;
  margin: 0 2px 1px 0;
  padding: 0.32em 0.8em 0.32em 0.8em;
  @media (max-width: 360px) {
    padding: 0.32em 0.4em 0.32em 0.4em;
  }

  background-color: ${(props) => props.theme.backgroundColor.primary};
  color: ${(props) => props.theme.color.primary};
  border-width: 1px;
  border-color: ${(props) => props.theme.color.primary};
  border-style: solid;
  border-radius: inherit;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left-width: 0;

  &:hover {
    background-color: ${(props) => props.theme.backgroundColor.primary};
    color: ${(props) => props.theme.color.positive};
    border-color: ${(props) => props.theme.color.positive};
  }
`
const SignUpEmail = styled(Form.Control)`
  width: 54%;
  @media (max-width: 360px) {
    width: 42%;
  }
  max-width: 18em;
  font-size: inherit;
  margin: 0 0 1px 1px;

  background-color: ${(props) => props.theme.backgroundColor.primary};
  color: ${(props) => props.theme.color.primary};
  border-color: ${(props) => props.theme.color.primary};
  border-style: solid;
  border-width: 1px;
  border-radius: inherit;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;

  &:focus {
    background-color: ${(props) => props.theme.backgroundColor.primary};
    color: ${(props) => props.theme.color.primary};
    border-color: ${(props) => props.theme.color.positive};
    box-shadow: none;
  }
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

// const TextStrikeThrough = styled.span`
//   text-decoration: line-through;
//   text-decoration-color: ${(props) => props.theme.color.positive};
// `
// const TextHighlight = styled.span`
//   font-weight: 900;
//   color: ${(props) => props.theme.color.positive};
// `

const themeDark = {
  backgroundColor: {
    primary: '#0c141f',
    positive: '#6EE2ff',
    negative: '#E6FFFF',
  },
  color: {
    primary: '#d9f6fa',
    positive: '#36cdff',
    negative: '',
  },
  image: {
    filter: 'brightness(.8) contrast(1.28)',
  },
}

export function LandingPage() {
  return (
    <ThemeProvider theme={themeDark}>
      <SlidesBox>
        <Slide>
          <Topbar>
            <Logo>
              <LogoImg src={getLogoImage(MimeType.IMAGE_SVG_XML)} /> Mazed
            </Logo>
            <Login />
          </Topbar>
          <FirstSlideBody>
            <FirstSlideLeftHalf>
              <Header>
                <div>
                  Reference anything you've read. <wbr />
                  <b>Without&nbsp;looking&nbsp;for&nbsp;it.</b>
                </div>
              </Header>
              <Description>
                Mazed&nbsp;is&nbsp;your&nbsp;second&nbsp;brain, serving you
                information you've read before, when&nbsp;you&nbsp;need&nbsp;it.
              </Description>
              <Comment>
                We&nbsp;are&nbsp;currently&nbsp;in&nbsp;a&nbsp;private&nbsp;beta.
                Register&nbsp;your&nbsp;email and&nbsp;we'll&nbsp;ping&nbsp;you
                when&nbsp;you're&nbsp;off&nbsp;the waitlist.
              </Comment>
              <SignUpForm />
              <TrustedByBox>
                <TrustedByTitle>
                  Trusted by engineers and their teams at these companies:
                </TrustedByTitle>
                <TrustedByLogosBox>
                  <LinkedinLogo size="1em" /> <GoogleLogo size="1em" />{' '}
                  <SalesforceLogo size="1em" />
                </TrustedByLogosBox>
              </TrustedByBox>
            </FirstSlideLeftHalf>
          </FirstSlideBody>
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
                <RefBtn href={routes.login}>Log In</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn
                  href={
                    'https://chrome.google.com/webstore/detail/mazed/hkfjmbjendcoblcoackpapfphijagddc'
                  }
                >
                  Download
                </RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={routes.terms}>Terms and Conditions</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={routes.privacy}>Privacy Policy</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={routes.cookiePolicy}>Cookie Policy</RefBtn>
              </FooterItem>
            </FooterCol>
            <FooterCol>
              <FooterItem>
                <RefBtn href={'https://mazed.se'}>mazed.se</RefBtn>
              </FooterItem>
              <FooterItem>
                <RefBtn href={'mailto: mazed@fastmail.com'}>
                  mazed@fastmail.com
                </RefBtn>
              </FooterItem>
            </FooterCol>
          </Footer>
        </LastSlide>
      </SlidesBox>
    </ThemeProvider>
  )
}
