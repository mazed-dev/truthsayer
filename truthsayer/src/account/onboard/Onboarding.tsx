/** @jsxImportSource @emotion/react */

import React from 'react'

import { useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { Modal, Button } from 'react-bootstrap'
import { AppsList } from '../../apps-list/AppsList'
import { accountConfig } from '../../account/config'

const InstallAppsStep = styled(AppsList)`
  padding: 0;
`

const kSteps = [
  {
    title: 'Install Apps',
    body: <InstallAppsStep />,
  },
]

function OnboardingModal({
  initialStep,
  onClose,
}: {
  initialStep?: number
  onClose: () => void
}) {
  const [show, setShow] = React.useState<boolean>(true /* param != null */)
  const [step, nextStep] = React.useReducer(
    (step: number, direction: 'next' | 'prev') => {
      step = step + (direction === 'next' ? 1 : -1)
      if (step >= kSteps.length) {
        step = kSteps.length
      }
      if (step < 0) {
        step = 0
      }
      return step
    },
    initialStep || 0
  )
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
          <Button variant="secondary" onClick={() => nextStep('prev')}>
            Previous
          </Button>
        ) : null}
        {step < kSteps.length - 1 ? (
          <Button variant="primary" onClick={() => nextStep('next')}>
            Next
          </Button>
        ) : null}
      </Modal.Footer>
    </Modal>
  )
}

export function Onboarding() {
  const history = useHistory()
  const onboardingStatus = accountConfig.local.onboarding.get()
  const onClose = () => {
    accountConfig.local.onboarding.set({ invoked: true })
    history.push({})
  }
  if (onboardingStatus.invoked === false) {
    return <OnboardingModal onClose={onClose} />
  }
  return null
}
