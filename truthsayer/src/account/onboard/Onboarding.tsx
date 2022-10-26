/** @jsxImportSource @emotion/react */

import React from 'react'

import { truthsayer_archaeologist_communication } from 'elementary'
import { log } from 'armoury'
import { parse } from 'query-string'

import { useHistory, Redirect, useLocation } from 'react-router-dom'
import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { Modal, Button } from 'react-bootstrap'
import { AppsList } from '../../apps-list/AppsList'
import { ExternalImport } from '../../external-import/ExternalImport'
import { accountConfig } from '../../account/config'

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
const kSteps: Step[] = [
  {
    title: 'Install Apps',
    body: <InstallAppsStep />,
  },
  {
    title: 'Import fragments',
    body: <ExternalImportStep />,
  },
]

function OnboardingModal({
  step,
  nextStep,
  onClose,
}: {
  step: number
  nextStep: (step: number) => void
  onClose: () => void
}) {
  const [show, setShow] = React.useState<boolean>(true /* param != null */)
  const nextStepChecked = (direction: 'next' | 'prev') => {
    step = step + (direction === 'next' ? 1 : -1)
    if (step >= kSteps.length) {
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
  const { title, body } = kSteps[step]
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
        {step < kSteps.length - 1 ? (
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

export function Onboarding() {
  const history = useHistory()
  const loc = useLocation()
  const step: number = parseInt(parse(loc.search)['step'] as string)
  const onboardingStatus = accountConfig.local.onboarding.get()
  const onClose = () => {
    accountConfig.local.onboarding.set({ invoked: true })
    history.push({})
  }
  if (onboardingStatus.invoked === false) {
    if (Number.isNaN(step)) {
      return <Redirect to={{ ...loc, search: '?step=0' }} />
    } else {
      return (
        <OnboardingModal
          onClose={onClose}
          step={step}
          nextStep={(step: number) => {
            log.debug('nextStep', step)
            history.push({ search: `step=${step}` })
          }}
        />
      )
    }
  }
  if (step != null) {
    // No reason to fuss about it - onboarding was invoked anyway. Just redirect
    // to the previous location
    return <Redirect to={{ ...loc, search: '' }} />
  }
  return null
}
