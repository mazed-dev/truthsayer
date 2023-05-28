/** @jsxImportSource @emotion/react */

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

const FontSize: string[] = ['50px', '37px', '28px', '21px', '16px', '12px']

const SlidesBox = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: auto;
  scroll-snap-type: y mandatory;

  font-family: 'Roboto', arial, sans-serif;
  font-size: ${FontSize[4]};

  color: ${(props) => props.theme.color.primary};
  background-color: ${(props) => props.theme.backgroundColor.primary};
`

const Slide = styled.div`
  width: 100vw;
  height: 100vh;

  scroll-snap-align: start;
  position: relative;
  margin: 0;
  padding: 0;
`

const FirstSlideBody = styled.div`
  height: 92%;
  padding: 0;
  margin: 0;
  width: 100%;

  display: flex;
  align-items: center;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;

  padding: 20px;
`
const Header = styled.h1`
  font-size: ${FontSize[0]};
  @media (max-width: 600px) {
    font-size: ${FontSize[2]};
  }
  text-align: center;
`
const Description = styled.h2`
  font-size: ${FontSize[1]};
  @media (max-width: 600px) {
    font-size: ${FontSize[4]};
  }
  text-align: center;
  margin: 10px 0 10px 0;
`
const Comment = styled.h2`
  font-size: ${FontSize[3]};
  @media (max-width: 600px) {
    font-size: ${FontSize[5]};
  }
  text-align: center;
  margin: 6px 0 12px 0;
`
const TrustedByBox = styled.div`
  margin-top: 2vh;
`
const TrustedByTitle = styled(Comment)``
const TrustedByLogosBox = styled.div`
  font-size: ${FontSize[0]};
  @media (max-width: 600px) {
    font-size: ${FontSize[2]};
  }
  display: flex;
  justify-content: center;
  gap: 0.8em;
  margin-top: 12px;
`

const Logo = styled.div`
  font-family: 'Comfortaa';
  font-weight: 900;
  font-size: ${FontSize[1]};
  @media (max-width: 600px) {
    font-size: ${FontSize[3]};
  }
  cursor: pointer;
  color: ${(props) => props.theme.color.primary};
  &:hover {
    border: none;
    background-color: ${(props) => props.theme.backgroundColor.primary};
  }
  display: flex;
  justify-content: center;
  align-content: center;
  flex-direction: row;
  align-items: baseline;
  flex-wrap: nowrap;
`

const LogoText = styled.span``

const LogoImg = styled.span`
  width: 0.86em;
  height: 0.86em;
  margin-right: 10px;
  mask: url(${getLogoImage(MimeType.IMAGE_SVG_XML)}) no-repeat center;
  background-color: ${(props) => props.theme.color.primary};
`
const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px;
  height: 6%;
`
const LoginBox = styled.div`
  margin-right: ${FontSize[4]};
  font-size: ${FontSize[4]};
`
const RefBtnBox = styled.a`
  background-color: white;
  border-color: white;

  font-size: inherit;
  text-decoration: none;

  background-color: ${(props) => props.theme.backgroundColor.primary};
  color: ${(props) => props.theme.color.primary}99;
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

const SignUpFormBox = styled.form`
  border-radius: 10px;
  width: 100%;

  font-size: ${FontSize[3]};
  @media (max-width: 600px) {
    font-size: ${FontSize[5]};
  }

  display: flex;
  justify-content: center;
  flex-wrap: nowrap;

  margin: 12px 0 0 0;
`
const SignUpBtn = styled.button`
  white-space: nowrap;
  cursor: pointer;
  font-size: inherit;
  margin: 0 2px 1px 0;
  padding: 0.32em 0.8em 0.32em 0.8em;
  @media (max-width: 360px) {
    padding: 0.2em 0.4em 0.2em 0.4em;
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
  width: 50%;
  @media (max-width: 360px) {
    width: 40%;
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

const SignUpBox = styled.div`
  margin-top: 8vh;
`
const SignUp = () => {
  const [email, setEmail] = useState<string>('')
  const emailElementRef = useRef<HTMLInputElement>(null)
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }
  const navigate = useNavigate()
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    authentication.user
      .register({
        name: email.split('@')[0],
        email: email,
      })
      .then(
        (res) => {
          if (res) {
            goto.notice.youAreInWaitingList(navigate, {
              name: email.split('@')[0],
              email: email,
            })
          }
        },
        (err) => {
          log.error('User registration failed with', err)
        }
      )
  }
  return (
    <SignUpBox>
      <Comment>
        We&nbsp;are&nbsp;currently&nbsp;in&nbsp;a&nbsp;private&nbsp;beta.
        Register&nbsp;your&nbsp;email and&nbsp;we'll&nbsp;ping&nbsp;you
        when&nbsp;you're&nbsp;off&nbsp;the waitlist.
      </Comment>
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
    </SignUpBox>
  )
}

const FooterBox = styled.div`
  width: 100%;
  position: absolute;
  bottom: 0;
  display: flex;
  justify-content: center;
`
const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: space-around;
  justify-content: center;
  padding: 6px;
  max-width: 850px;
`

const FooterCol = styled.div`
  text-align: center;
`
const FooterItem = styled.div`
  font-size: ${FontSize[5]};
  margin: 0 16px 4px 16px;
`

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
              <LogoImg />
              <LogoText>Mazed</LogoText>
            </Logo>
            <Login />
          </Topbar>
          <FirstSlideBody>
            <Header>
              Reference&nbsp;anything you've&nbsp;read.
              <wbr />
              <b> Without&nbsp;looking&nbsp;for&nbsp;it.</b>
            </Header>
            <Description>
              Mazed&nbsp;is&nbsp;your&nbsp;second&nbsp;brain, serving you
              information you've read before, when&nbsp;you&nbsp;need&nbsp;it.
            </Description>
            <SignUp />
            <TrustedByBox>
              <TrustedByTitle>
                Trusted by engineers at&nbsp;these&nbsp;companies:
              </TrustedByTitle>
              <TrustedByLogosBox>
                <LinkedinLogo size="1em" />
                <GoogleLogo size="1em" />
                <SalesforceLogo size="1em" />
              </TrustedByLogosBox>
            </TrustedByBox>
          </FirstSlideBody>
          <FooterBox>
            <Footer>
              <FooterCol>
                <FooterItem>
                  <RefBtn href={routes.about}>About</RefBtn>
                </FooterItem>
              </FooterCol>
              <FooterCol>
                <FooterItem>
                  <RefBtn href={routes.terms}>Terms of Service</RefBtn>
                </FooterItem>
              </FooterCol>
              <FooterCol>
                <FooterItem>
                  <RefBtn href={routes.privacy}>Privacy Policy</RefBtn>
                </FooterItem>
              </FooterCol>
              <FooterCol>
                <FooterItem>
                  <RefBtn href={routes.cookiePolicy}>Cookies Policy</RefBtn>
                </FooterItem>
              </FooterCol>
              <FooterCol>
                <FooterItem>
                  <RefBtn href={'mailto: inquiries@mazed.dev'}>
                    inquiries@mazed.dev
                  </RefBtn>
                </FooterItem>
              </FooterCol>
            </Footer>
          </FooterBox>
        </Slide>
      </SlidesBox>
    </ThemeProvider>
  )
}
