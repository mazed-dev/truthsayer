/** @jsxImportSource @emotion/react */
// @ts-nocheck

import React from 'react'

import { Button, Card } from 'react-bootstrap'

import { GridCard } from '../../grid/SearchGrid.js'
import { DateTimeBadge } from '../components/DateTime.js'
import { makeDateTime } from '../types.js'
import { tryToParseDate } from './jinn-datetime-parse.js'

import { base64 } from 'armoury'

import { default as styled } from '@emotion/styled'

const ColBtn = styled.div`
  height: 3.4em;
  position: relative;
`

const Btn = styled(Button)`
  position: absolute;
  right: 0;
  top: 2px;
`

export const DateTimeCardItem = ({ time, format, onInsert }) => {
  const onClick = () => onInsert(time.unix(), format)
  return (
    <div>
      <div>
        <DateTimeBadge time={time} format={format} />
      </div>
      <ColBtn>
        <Btn onClick={onClick} variant={'success'}>
          Insert
        </Btn>
      </ColBtn>
    </div>
  )
}

export const DateTimeCard = React.forwardRef(({ items, onInsert }, ref) => {
  // TODO(akindyakov): continue here
  const children = items.map((item) => {
    const { time, format } = item
    const key = `${time.valueOf()}-${base64.string.fromObject(format)}`
    return (
      <DateTimeCardItem
        time={time}
        format={format}
        onInsert={onInsert}
        key={key}
      />
    )
  })
  return (
    <GridCard onClick={null} css={{ padding: '8px' }} ref={ref}>
      <Card.Title>Date & time</Card.Title>
      {children}
    </GridCard>
  )
})

export const dateTimeJinnSearch = (
  value: string,
  insertElement: (element: SlateElement) => void
) => {
  const items = tryToParseDate(value)
  if (items.length === 0) {
    return null
  }
  const onInsert = (timestamp: number, format?: string) => {
    insertElement(makeDateTime(timestamp, format))
  }
  const key = 'mazed-date-time-jinn-card'
  return <DateTimeCard items={items} key={key} onInsert={onInsert} />
}
