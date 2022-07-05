import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { Box, LogoSmall, RefItem } from './../style'
import { HoverTooltip } from 'elementary'

const kToasterBoxElementId = 'mazed-archaeologist-toaster-id'
const ToasterBox = styled.div`
  position: fixed !important;
  top: 24px !important;
  right: 32px !important;
`
export const Toaster = ({ children }: React.PropsWithChildren<{}>) => {
  const container = document.createElement(
    'mazed-archaeologist-toaster-container'
  )
  React.useEffect(
    () => {
      const target = document.body
      target.appendChild(container)
      return () => {
        target.removeChild(container)
      }
    }
    /**
     * There is no dependency list here on purpose, otherwise content updates to
     * the container do not get through.
     */
  )
  return ReactDOM.createPortal(
    <ToasterBox id={kToasterBoxElementId}>{children}</ToasterBox>,
    container
  )
}

const kShowUpAnimation = keyframes`
  0% {
    transform: scale(.025, 1);
  }
  100% {
    transform: scale(1, 1);
  }
`

const ToastBox = styled(Box)`
  z-index: 99999;
  animation-name: ${kShowUpAnimation};
  animation-duration: 0.25s;
  animation-iteration-count: 1;
`
export const Toast = ({
  children,
  id,
}: React.PropsWithChildren<{ id: string }>) => {
  const box = document.createElement('mazed-archaeologist-toast')
  React.useEffect(
    () => {
      const target = document.getElementById(kToasterBoxElementId)
      target?.appendChild(box)
      return () => {
        target?.removeChild(box)
      }
    }
    /**
     * There is no dependency list here on purpose, otherwise content updates to
     * the container are not get through.
     */
  )
  return ReactDOM.createPortal(<ToastBox key={id}>{children}</ToastBox>, box)
}

export type DisappearingToastProps = {
  text: string
  href?: string
  tooltip?: string
  timeoutMsec?: number
  id?: string
}

export const DisappearingToast = ({
  text,
  href,
  tooltip,
  timeoutMsec,
  id,
}: DisappearingToastProps) => {
  const [show, setShow] = React.useState(true)
  React.useEffect(() => {
    const callbackId = setTimeout(() => {
      setShow(false)
    }, timeoutMsec ?? 3099)
    return () => clearTimeout(callbackId)
  }, [text, tooltip, timeoutMsec, id])
  return show ? (
    <Toast id={'disappearing-toast'}>
      <LogoSmall />
      <RefItem href={href}>
        <HoverTooltip tooltip={tooltip ?? text}>{text}</HoverTooltip>
      </RefItem>
    </Toast>
  ) : null
}
