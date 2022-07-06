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
  /**
  * This is an effect to inject element container to the content DOM tree. There
  * are 2 reasons to use `useEffect` for it:
  *
  *   1. We need a clean up (see lambda as a return value of `useEffect`).
  *   Otherwise react would never delete rendered element.
  *   2. Container has to be deleted-and-added __on every render__, otherwise we
  *   would see only first version of the element without any further updates.
  *   There is no dependency list here on purpose, to re-inject container into
  *   the content DOM on every update.
  */
  React.useEffect(
    () => {
      const target = document.body
      target.appendChild(container)
      return () => {
        target.removeChild(container)
      }
    }
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
  toastKey,
}: React.PropsWithChildren<{ toastKey: string }>) => {
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
     * the box do not get through.
     */
  )
  return ReactDOM.createPortal(<ToastBox key={toastKey}>{children}</ToastBox>, box)
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
    <Toast toastKey={'disappearing-toast'}>
      <LogoSmall />
      <RefItem href={href}>
        <HoverTooltip tooltip={tooltip ?? text}>{text}</HoverTooltip>
      </RefItem>
    </Toast>
  ) : null
}
