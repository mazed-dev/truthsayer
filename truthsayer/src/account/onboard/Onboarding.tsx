/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { parse } from 'query-string'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from '@emotion/styled'
import { Button, Container } from 'react-bootstrap'
import {
  FromTruthsayer,
  ToTruthsayer,
} from 'truthsayer-archaeologist-communication'
import { AppsList } from '../../apps-list/AppsList'
import { ExternalImportProgress } from '../../external-import/ExternalImport'
import { routes, goto } from '../../lib/route'
import { ArchaeologistState } from '../../apps-list/archaeologistState'
import { sleep, isAbortError, productanalytics, errorise } from 'armoury'
import { MdiClose } from 'elementary'

const Header = styled.h1`
  margin-bottom: 24px;
  font-size: 26px;
`

const Box = styled(Container)`
  margin: 30vh auto auto auto;
  max-width: 800px;
`
const StepBox = styled.div`
  margin-bottom: 24px;
`
const DescriptionBox = styled.div`
  margin-bottom: 24px;
`
const DescriptionList = styled.ul``
const ReadyToGoDescriptionListItem = styled.li`
  list-style-type: '🚀';
  padding-left: 12px;
`
const AppDescriptionListItem = styled.li`
  list-style-type: '✅';
  padding-left: 12px;
`
const StepFotbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  padding: 0.5rem;
`
const FootNote = styled.div`
  margin-top: 24px;
`
const RefBtn = styled.a`
  font-size: inherit;
  color: inherit;
  border: none;

  font-weight: 550;
  &:hover {
    color: inherit;
    font-weight: 600;
  }
`
const StepFotbarButton = styled(Button)`
  margin: 0.25rem;
`
const InstallAppsStep = styled(AppsList)`
  padding: 0;
`

const StepWelcomePleaseInstall = ({
  archaeologistState,
  nextStep,
}: {
  archaeologistState: ArchaeologistState
  nextStep: () => void
}) => {
  useAsyncEffect(async () => {
    if (archaeologistState.state === 'installed') {
      nextStep()
    }
    if (archaeologistState.state === 'not-installed') {
      let version: ToTruthsayer.ArchaeologistVersion | null = null
      for (let attempt = 0; attempt < 9999; ++attempt) {
        try {
          const response = await FromTruthsayer.sendMessage({
            type: 'GET_ARCHAEOLOGIST_STATE_REQUEST',
          })
          version = response.version
          break
        } catch (e) {
          const err = errorise(e)
          if (isAbortError(err)) {
            break
          }
        }
        await sleep(101)
      }
      if (version != null) {
        await FromTruthsayer.sendMessage({
          type: 'ACTIVATE_MY_TAB_REQUEST',
          reload: true,
        })
      }
    }
  }, [archaeologistState, nextStep])
  return (
    <StepBox>
      <Header>
        Welcome to Foreword!
        <br />
        Let's set up your second brain.
      </Header>
      <DescriptionBox>
        <DescriptionList>
          <AppDescriptionListItem>
            <b>Instant.</b> Foreword allows you reference anything you've read,
            without searching for it.
          </AppDescriptionListItem>
          <AppDescriptionListItem>
            <b>Automatic.</b> Foreword helps you remember everything you read,
            automatically.
          </AppDescriptionListItem>
          <AppDescriptionListItem>
            <b>Private.</b> Nothing you read or write leaves your device, with
            local storage.
          </AppDescriptionListItem>
        </DescriptionList>
      </DescriptionBox>
      <InstallAppsStep archaeologist={archaeologistState} />
      <FootNote>
        By continuing, you agree to Foreword's{' '}
        <RefBtn href={routes.terms} target="_blank" rel="noopener noreferrer">
          Terms of Service
        </RefBtn>{' '}
        and{' '}
        <RefBtn href={routes.privacy} target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </RefBtn>
        .
      </FootNote>
    </StepBox>
  )
}

const StepYouAreReadyToGo = ({
  nextStep,
  prevStep,
}: {
  nextStep: () => void
  prevStep: () => void
}) => {
  return (
    <StepBox>
      <Header>
        You're ready to go! You're on your way to a smarter, more productive
        life.
      </Header>
      <DescriptionBox>
        <DescriptionList>
          <ReadyToGoDescriptionListItem>
            Browse the internet as you normally do. Foreword saves everything
            you read, automatically, in your own private, local storage.
          </ReadyToGoDescriptionListItem>
          <ReadyToGoDescriptionListItem>
            Use anything you've read, without searching for it. Foreword
            overlays your existing workflows and serves you your relevant
            information, exactly when you need it.
          </ReadyToGoDescriptionListItem>
          <ReadyToGoDescriptionListItem>
            Book a call with our founders, to provide feedback and make special
            requests{' '}
            <a href="https://calendly.com/grahamgrieve/30min">
              https://calendly.com/grahamgrieve
            </a>
          </ReadyToGoDescriptionListItem>
        </DescriptionList>
      </DescriptionBox>
      <StepFotbar>
        <StepFotbarButton variant="outline-secondary" onClick={prevStep}>
          Previous
        </StepFotbarButton>
        <StepFotbarButton variant="primary" onClick={nextStep}>
          Next
        </StepFotbarButton>
      </StepFotbar>
    </StepBox>
  )
}

const StepSetYourAccountPassword = ({
  nextStep,
  prevStep,
}: {
  nextStep: () => void
  prevStep: () => void
}) => {
  return (
    <StepBox>
      <Header>Set your account password.</Header>
      <DescriptionBox>
        If this is your first time using Foreword, check your inbox and locate
        the confirmation email (subject: "Reset your Foreword password"). Follow
        the steps in the email to confirm your email address and come back here.
      </DescriptionBox>
      <StepFotbar>
        <StepFotbarButton variant="outline-secondary" onClick={prevStep}>
          Previous
        </StepFotbarButton>
        <StepFotbarButton variant="primary" onClick={nextStep}>
          Next
        </StepFotbarButton>
      </StepFotbar>
    </StepBox>
  )
}

const StepTangoShowAroundBox = styled(StepBox)`
  margin: 0 auto 0 auto;
  padding-top: calc(100vh - 1200px);
  height: calc(100vh - 40px); /* leave some space for bottom bar */
  width: 100%;
  @media (min-width: 740px) {
    width: 740px;
  }
`

const StepArcadeIframeBox = styled.div`
  position: relative;
  padding-bottom: calc(56.25% + 41px);
  height: 0;
`
const StepArcadeIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color-scheme: light;
`
const StepArcadeBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
`
const StepTangoShowAround = ({ onClose }: { onClose: () => void }) => {
  return (
    <StepTangoShowAroundBox>
      <StepArcadeBar>
        <Button
          variant="outline-default"
          onClick={onClose}
          size="sm"
          {...productanalytics.autocaptureIdentity('btn-onboarding-done')}
        >
          <MdiClose />
        </Button>
      </StepArcadeBar>
      <StepArcadeIframeBox>
        <StepArcadeIframe
          src="https://demo.arcade.software/SE7RpzZGj6eq5F0TUNm5?embed"
          frameBorder="0"
          loading="lazy"
          allowFullScreen
          title="Let's get you started"
        ></StepArcadeIframe>
      </StepArcadeIframeBox>
    </StepTangoShowAroundBox>
  )
}

function OnboardingSteps({
  archaeologistState,
  progress,
  step,
  nextStep,
  onClose,
}: {
  step: number
  nextStep: (step: number) => void
  onClose: () => void
  archaeologistState: ArchaeologistState
  progress: ExternalImportProgress
}) {
  const kStepsNumber = 3
  const nextStepChecked = () => {
    step = step + 1
    if (step >= kStepsNumber) {
      onClose()
    }
    if (step >= 0) {
      nextStep(step)
    }
  }
  const prevStepChecked = () => {
    step = step - 1
    if (step >= 0) {
      nextStep(step)
    }
  }
  switch (step) {
    case 0:
      return (
        <Box>
          <StepWelcomePleaseInstall
            archaeologistState={archaeologistState}
            nextStep={nextStepChecked}
          />
        </Box>
      )
    case 1:
      return (
        <Box>
          <StepSetYourAccountPassword
            prevStep={prevStepChecked}
            nextStep={nextStepChecked}
          />
        </Box>
      )
    case 2:
      return (
        <Box>
          <StepYouAreReadyToGo
            prevStep={prevStepChecked}
            nextStep={nextStepChecked}
          />
        </Box>
      )
    default:
      return <StepTangoShowAround onClose={onClose} />
  }
}

function parseStepFromSearchString(search: string): number {
  const step = parseInt(parse(search)['step'] as string)
  if (Number.isNaN(step)) {
    return 0
  }
  return step
}

export function Onboarding({
  archaeologistState,
  progress,
}: {
  archaeologistState: ArchaeologistState
  progress: ExternalImportProgress
}) {
  const loc = useLocation()
  const navigate = useNavigate()
  const onboardingStep = parseStepFromSearchString(loc.search)
  const onClose = () => {
    // Navigate to /search without react-route history object to fully reload
    // Truthsayer web app, otherwise bootstraped cards not always show up
    goto.search({ query: '' })
  }
  return (
    <OnboardingSteps
      onClose={onClose}
      step={onboardingStep}
      nextStep={(step: number) => navigate({ search: `step=${step}` })}
      archaeologistState={archaeologistState}
      progress={progress}
    />
  )
}
