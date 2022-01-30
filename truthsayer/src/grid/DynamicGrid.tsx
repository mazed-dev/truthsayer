import React, { useRef, useState, useEffect } from 'react'

import { Container, Row, Col } from 'react-bootstrap'

import { range } from '../util/range'

import styles from './SearchGrid.module.css'

import { jcss } from 'elementary'

export const DynamicGrid = ({
  children,
  columns_n_min,
}: {
  children: JSX.Element[]
  columns_n_min?: number
}) => {
  const columnsNMin = columns_n_min || 2
  const [ncols, setNCols] = useState(columnsNMin)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateWindowDimensions = () => {
      const containerEl = containerRef.current
      const width = containerEl?.clientWidth || window.innerWidth
      const cardWidth = 226,
        minGap = 6 // TODO(akindyakov): calculate this properly
      const nf = Math.floor(width / (cardWidth + minGap))
      const ncols = Math.max(columnsNMin, nf)
      setNCols(ncols)
    }
    updateWindowDimensions()
    window.addEventListener('resize', updateWindowDimensions)
    return () => {
      window.removeEventListener('resize', updateWindowDimensions)
    }
  })

  const columns = range(ncols).map((_, col_ind) => {
    const colCards = children.filter((_, card_ind) => {
      return card_ind % ncols === col_ind
    })
    return (
      <Col
        className={styles.grid_col}
        key={`cards_column_${col_ind}`}
        sm="auto"
      >
        {colCards}
      </Col>
    )
  })
  return (
    <Container fluid className={jcss(styles.grid_container)} ref={containerRef}>
      <Row className={jcss('justify-content-center', styles.grid_row)}>
        {columns}
      </Row>
    </Container>
  )
}
