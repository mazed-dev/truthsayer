import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import root from 'react-shadow/emotion'

const kMountBoxElementId = 'mazed-archaeologist-augmentation-mount-point-id'
const ToasterBox = styled.div`
  z-index: 2147483647;
  position: fixed !important;
  top: 24px !important;
  right: 32px !important;
`
export const AugmentationMountPoint = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const container = document.createElement(
    'mazed-archaeologist-augmentation-mount-point'
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
  React.useEffect(() => {
    const target = document.body
    target.appendChild(container)
    return () => {
      target.removeChild(container)
    }
  })
  return ReactDOM.createPortal(
    <ToasterBox id={kMountBoxElementId}>{children}</ToasterBox>,
    container
  )
}

export const AugmentationElement = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const box = document.createElement('mazed-archaeologist-toast')
  React.useEffect(
    () => {
      const target = document.getElementById(kMountBoxElementId)
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
  return ReactDOM.createPortal(
    <root.div id={'mazed-archaeologist-augmentation-element'}>
      {children}
    </root.div>,
    box
  )
}