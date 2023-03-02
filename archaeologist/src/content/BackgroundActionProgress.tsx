import { Spinner } from 'elementary'
import React from 'react'
import ReactDOM from 'react-dom'
import type { BackgroundAction } from 'truthsayer-archaeologist-communication'
import { BackgroundActionProgressConnection } from 'truthsayer-archaeologist-communication'
import type { BackgroundActionProgress } from '../message/types'

export type BackgroundActionProgressProps = {
  progress: BackgroundActionProgress
  operation: BackgroundAction
}

function BackgroundActionProgressSpinner({
  processed,
  total,
}: BackgroundActionProgress) {
  if (processed === total) {
    return <></>
  }
  return (
    <>
      <Spinner.Ring />[{processed}/{total}]
    </>
  )
}

export function BackgroundActionProgressPortal(
  props: BackgroundActionProgressProps
) {
  const container = document.createElement(
    `mazed-archaeologist-${props.operation}-control`
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const beacon = BackgroundActionProgressConnection.archaeologist.findBeacon(
      document,
      props.operation
    )
    beacon?.appendChild(container)
    return () => {
      beacon?.removeChild(container)
    }
  })
  return ReactDOM.createPortal(
    <div>
      <BackgroundActionProgressSpinner
        {...props.progress}
      ></BackgroundActionProgressSpinner>
    </div>,
    container
  )
}
