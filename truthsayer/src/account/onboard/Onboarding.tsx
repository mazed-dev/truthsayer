/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { parse } from 'query-string'
import { useLocation } from 'react-router-dom'
import styled from '@emotion/styled'
import { Button, Container } from 'react-bootstrap'
import {
  FromTruthsayer,
  ToTruthsayer,
} from 'truthsayer-archaeologist-communication'
import { AppsList } from '../../apps-list/AppsList'
import { routes, goto } from '../../lib/route'
import { ArchaeologistState } from '../../apps-list/archaeologistState'
import { sleep, isAbortError, productanalytics, errorise } from 'armoury'
import { MdiClose } from 'elementary'
import MzdGlobalContext from '../../lib/global'
import { accountConfig } from '../config'

/**
 * Current version of the onboarding process.
 *
 * Increment it if you want to make users go through the onboarding process again,
 * for example, if there are new steps.
 */
const ONBOARDING_VERSION = 0

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
  navigation,
  skipIfAlreadyDone,
}: {
  archaeologistState: ArchaeologistState
  navigation: OnboardingNavigation
  skipIfAlreadyDone: boolean
}) => {
  const { nextStep } = navigation
  useAsyncEffect(async () => {
    if (archaeologistState.state === 'installed' && skipIfAlreadyDone) {
      nextStep()
      return
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
  navigation,
}: {
  navigation: OnboardingNavigation
}) => {
  const { nextStep, prevStep } = navigation
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
  navigation,
  skipIfAlreadyDone,
}: {
  navigation: OnboardingNavigation
  skipIfAlreadyDone: boolean
}) => {
  const { nextStep, prevStep } = navigation
  const ctx = React.useContext(MzdGlobalContext)
  React.useEffect(() => {
    if (ctx.account != null && skipIfAlreadyDone) {
      nextStep()
    }
  }, [ctx, nextStep, skipIfAlreadyDone])
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
  navigation,
}: {
  archaeologistState: ArchaeologistState
  progress: OnboardingProgress
  navigation: OnboardingNavigation
}) {
  switch (progress.currentStep) {
    case 0:
      return (
        <Box>
          <StepWelcomePleaseInstall
            archaeologistState={archaeologistState}
            navigation={navigation}
            skipIfAlreadyDone={!progress.manuallyWentBack}
          />
        </Box>
      )
    case 1:
      return (
        <Box>
          <StepSetYourAccountPassword
            navigation={navigation}
            skipIfAlreadyDone={!progress.manuallyWentBack}
          />
        </Box>
      )
    case 2:
      return (
        <Box>
          <StepYouAreReadyToGo navigation={navigation} />
        </Box>
      )
    default:
      return <StepTangoShowAround onClose={navigation.finish} />
  }
}

function parseStepFromSearchString(search: string): number | undefined {
  const step = parseInt(parse(search)['step'] as string)
  if (Number.isNaN(step)) {
    return 0
  }
  return step
}

function nextStepSinceLastTime(
  prevStatus: accountConfig.local.onboarding.OnboardingStatus
): number {
  if (prevStatus.version !== ONBOARDING_VERSION) {
    // If the onboarding process changed since last time, start from scratch
    return 0
  }
  if (prevStatus.progress !== 'in-progress') {
    // NOTE: it may be unintuitive that the function returns step 0 in case
    // the previous status is 'completed'. However if it didn't then it would not
    // be possible to re-run the onboarding process which may be needed to, for
    // example:
    //    - guide a user to re-install archaeologist
    //    - show user a tutorial again
    //    - register a new account for demo purposes
    //    - etc
    //
    // This behaviour implies the code which redirects to '/onboarding'
    // will make a decision what to do if onboarding was already completed and,
    // if appropriate, not open '/onboarding' at all.
    return 0
  }
  return prevStatus.nextStep
}

type OnboardingNavigation = {
  nextStep: () => void
  prevStep: () => void
  finish: () => void
}

type OnboardingProgress = {
  currentStep: number
  manuallyWentBack: boolean
}

export function Onboarding({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}) {
  const loc = useLocation()
  const [progress, setProgress] = React.useState<OnboardingProgress>(() => {
    return {
      currentStep:
        parseStepFromSearchString(loc.search) ??
        nextStepSinceLastTime(accountConfig.local.onboarding.get()),
      manuallyWentBack: false,
    }
  })
  const navigation: OnboardingNavigation = {
    nextStep: React.useCallback(() => {
      const next = progress.currentStep + 1
      accountConfig.local.onboarding.set({
        version: ONBOARDING_VERSION,
        progress: 'in-progress',
        nextStep: next,
      })
      setProgress({ currentStep: next, manuallyWentBack: false })
    }, [progress, setProgress]),
    prevStep: React.useCallback(() => {
      const next = progress.currentStep - 1
      setProgress({ currentStep: next >= 0 ? next : 0, manuallyWentBack: true })
    }, [progress, setProgress]),
    finish: () => {
      accountConfig.local.onboarding.set({
        version: ONBOARDING_VERSION,
        progress: 'completed',
      })
      goto.search({ query: '' })
    },
  }
  return (
    <OnboardingSteps
      progress={progress}
      navigation={navigation}
      archaeologistState={archaeologistState}
    />
  )
}
