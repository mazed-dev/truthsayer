/** @jsxImportSource @emotion/react */

import React, { useRef, useState, useEffect } from 'react'
import { kSmallCardWidth } from '../SmallCard'

export const DynamicGrid = ({
  children,
  columns_n_min,
  columns_n_max,
  className,
}: {
  children: JSX.Element[]
  columns_n_min?: number
  columns_n_max?: number
  className?: string
}) => {
  const columnsNMin = columns_n_min || 2
  const columnsNMax = columns_n_max || 99
  const [ncols, setNCols] = useState<number>(columnsNMin)
  const containerRef = useRef<HTMLDivElement>(null)

  // TODO(akindyakov): calculate gap size and card width properly here
  const cardWidth = kSmallCardWidth
  const minGap = 6

  useEffect(() => {
    const updateWindowDimensions = () => {
      const containerEl = containerRef.current
      const width = containerEl?.clientWidth || window.innerWidth
      const nf = Math.floor(width / (cardWidth + minGap))
      const ncols = Math.min(Math.max(columnsNMin, nf), columnsNMax)
      setNCols(ncols)
    }
    updateWindowDimensions()
    window.addEventListener('resize', updateWindowDimensions)
    return () => {
      window.removeEventListener('resize', updateWindowDimensions)
    }
  })

  return (
    <div
      className={className}
      css={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'auto '.repeat(ncols),
        gridGap: '4px',
      }}
      ref={containerRef}
    >
      {children}
    </div>
  )
}
