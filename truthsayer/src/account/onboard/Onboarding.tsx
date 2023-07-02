/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { parse } from 'query-string'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import styled from '@emotion/styled'
import { Button, Container } from 'react-bootstrap'
import { Helmet } from 'react-helmet'
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
const AppDescriptionListItem = styled.li`
  list-style-type: '✅';
  padding-left: 12px;
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

const IncludeTypeformScript = () => {
  return (
    <Helmet defer>
      <script src="//embed.typeform.com/next/embed.js"></script>
    </Helmet>
  )
}

const StepTypeformBox = styled(StepBox)`
  margin: 0 auto 0 auto;
  height: calc(100vh - 90px); /* leave some space for bottom bar */
  width: 100%;
`
const TypeformEmbed = styled.div`
  width: 100%;
  height: 100%;
`
const StepCalendlyTypeform = ({ onClose }: { onClose: () => void }) => {
  return (
    <StepTypeformBox>
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
      <TypeformEmbed
        data-tf-widget="eNXMCoQN"
        data-tf-opacity="100"
        data-tf-inline-on-mobile
        data-tf-iframe-props="title=Book a calendar"
        data-tf-transitive-search-params
        data-tf-medium="snippet"
      />
      <IncludeTypeformScript />
    </StepTypeformBox>
  )
}

const StepLearnAboutUserTypeform = () => {
  return (
    <StepTypeformBox>
      <TypeformEmbed
        data-tf-widget="yUrEEDLX"
        data-tf-opacity="100"
        data-tf-inline-on-mobile
        data-tf-iframe-props="title=Foreword Onboarding"
        data-tf-transitive-search-params
        data-tf-auto-focus
        data-tf-medium="snippet"
      />
      <IncludeTypeformScript />
    </StepTypeformBox>
  )
}

const StepArcadeBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
`

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
      return <StepLearnAboutUserTypeform />
    case 2:
      return <StepCalendlyTypeform onClose={onClose} />
    default:
      return <Navigate to={routes.search} />
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
    goto.search({ navigate, query: '' })
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
