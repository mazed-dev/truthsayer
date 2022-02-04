/** @jsxImportSource @emotion/react */

import React, { useRef, useState, useEffect } from 'react'

import { Container, Row, Col } from 'react-bootstrap'

import { range } from '../util/range'

import styles from './SearchGrid.module.css'
import * as log from '../util/log'

type JustifyContentType =
  | 'start'
  | 'end'
  | 'center'
  | 'space-between'
  | 'space-around'

export const DynamicGrid = ({
  children,
  columns_n_min,
  columns_n_max,
  className,
  justify_content,
}: {
  children: JSX.Element[]
  columns_n_min?: number
  columns_n_max?: number
  className?: string
  justify_content?: JustifyContentType
}) => {
  const columnsNMin = columns_n_min || 2
  const columnsNMax = columns_n_max || 99
  const [ncols, setNCols] = useState(columnsNMin)
  const containerRef = useRef<HTMLDivElement>(null)
  log.debug('DynamicGrid.className', className)

  justify_content = justify_content || 'center'

  useEffect(() => {
    const updateWindowDimensions = () => {
      const containerEl = containerRef.current
      const width = containerEl?.clientWidth || window.innerWidth
      const cardWidth = 226,
        minGap = 6 // TODO(akindyakov): calculate this properly
      const nf = Math.floor(width / (cardWidth + minGap))
      const ncols = Math.min(Math.max(columnsNMin, nf), columnsNMax)
      log.debug('DynamicGrid.updateWindowDimensions', width, ncols)
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
        justifyContent: justify_content,
        gridGap: '6px',
      }}
      ref={containerRef}
    >
      {children}
    </div>
  )
}
