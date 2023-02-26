/** @jsxImportSource @emotion/react */

import React from 'react'
import { parse } from 'query-string'
import { useHistory, Redirect, useLocation } from 'react-router-dom'
import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { Modal, Button } from 'react-bootstrap'
import { AppsList } from '../../apps-list/AppsList'
import { ExternalImport } from '../../external-import/ExternalImport'
import { accountConfig } from '../../account/config'
import { ArchaeologistState } from '../../apps-list/archaeologistState'

const InstallAppsStep = styled(AppsList)`
  padding: 0;
`

const ExternalImportStep = styled(ExternalImport)`
  padding: 0;
`

type Step = {
  title: string
  body: React.ReactNode
}
function steps({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}): Step[] {
  return [
    {
      title: 'Install Apps',
      body: <InstallAppsStep archaeologist={archaeologistState} />,
    },
    {
      title: 'Import fragments',
      body: (
        <ExternalImportStep
          archaeologistState={archaeologistState}
          browserHistoryImportConfig={
            // NOTE: one of the goals of the onboarding experience is to showcase
            // the value of the product to a new user as quick as possible, before
            // the product loses their attention. For this reason the slower modes
            // of browser history import modes are not enabled.
            { modes: ['untracked'] }
          }
        />
      ),
    },
  ]
}

function OnboardingModal({
  archaeologistState,
  step,
  nextStep,
  onClose,
}: {
  step: number
  nextStep: (step: number) => void
  onClose: () => void
  archaeologistState: ArchaeologistState
}) {
  const [show, setShow] = React.useState<boolean>(true /* param != null */)
  const [allSteps] = React.useState<Step[]>(steps({ archaeologistState }))

  const nextStepChecked = (direction: 'next' | 'prev') => {
    step = step + (direction === 'next' ? 1 : -1)
    if (step >= allSteps.length) {
      onClose()
    }
    if (step >= 0) {
      nextStep(step)
    }
  }
  const onHide = () => {
    onClose()
    setShow(false)
  }
  const { title, body } = allSteps[step]
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      keyboard
      restoreFocus={false}
      animation={false}
      scrollable
      enforceFocus
    >
      <Modal.Header closeButton closeLabel={'Skip'}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body
        css={css`
          padding: 12px 24px 12px 24px;
        `}
      >
        {body}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Skip
        </Button>
        {step > 0 ? (
          <Button variant="secondary" onClick={() => nextStepChecked('prev')}>
            Previous
          </Button>
        ) : null}
        {step < allSteps.length - 1 ? (
          <Button variant="primary" onClick={() => nextStepChecked('next')}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={onHide}>
            Done
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export function Onboarding({
  archaeologistState,
}: {
  archaeologistState: ArchaeologistState
}) {
  const loc = useLocation()
  const onboardingStep: number = parseInt(
    parse(loc.search)['onboarding_step'] as string
  )
  const onboardingStatus = accountConfig.local.onboarding.get()
  const history = useHistory()
  const onClose = () => {
    accountConfig.local.onboarding.set({ invoked: true })
    history.push({ ...loc, search: '' })
  }
  if (onboardingStatus.invoked === false) {
    if (Number.isNaN(onboardingStep)) {
      return <Redirect to={{ ...loc, search: '?onboarding_step=0' }} />
    }
  }
  if (!Number.isNaN(onboardingStep)) {
    return (
      <OnboardingModal
        onClose={onClose}
        step={onboardingStep}
        nextStep={(step: number) => {
          history.push({ search: `onboarding_step=${step}` })
        }}
        archaeologistState={archaeologistState}
      />
    )
  }
  return null
}
