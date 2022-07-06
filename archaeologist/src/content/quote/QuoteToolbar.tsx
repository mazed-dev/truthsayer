import React, { useEffect, useRef } from 'react'
import { mazed } from '../../util/mazed'
import { LogoSmall, Box, RefItem } from '../style'

export const QuoteToolbar = ({
  nid,
  onExit,
}: {
  nid: string
  onExit: () => void
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const clickListener = (event: MouseEvent) => {
    const { target } = event
    if (target && !ref?.current?.contains(target as Node)) {
      onExit()
    }
  }
  useEffect(() => {
    document.addEventListener('mousedown', clickListener, {
      capture: false,
      passive: true,
    })

    return () => {
      document.removeEventListener('mousedown', clickListener, {
        capture: false,
      })
    }
  })
  const truthsayerNodeUrl = mazed.makeNodeUrl(nid).toString()
  return (
    <Box ref={ref}>
      <LogoSmall />
      <RefItem href={truthsayerNodeUrl}>Open</RefItem>
    </Box>
  )
}
