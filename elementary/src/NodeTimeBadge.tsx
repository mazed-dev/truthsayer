import React from 'react'

import styled from '@emotion/styled'

import moment from 'moment'

import { HoverTooltip } from './HoverTooltip'

function formatDate(m: moment.Moment) {
  const sameElse = function (m?: moment.MomentInput, now?: moment.Moment) {
    const mm = moment(m)
    if (now && mm.year() === now.year()) {
      return 'dddd, D MMM'
    } else {
      return 'dddd, D MMM YYYY'
    }
  }
  return m.calendar({
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse,
  })
}

function formatFullDate(m: moment.Moment) {
  return m.format('dddd, MMMM Do YYYY, HH:mm')
}

const CreatedAt = styled.div`
  color: #6c757d;
  font-size: 11px;
  font-style: italic;
  text-align: right;
`

const Badge = styled.div`
  padding: 4px 4px 0 4px;
`

const Column = styled.div`
  float: right;
`

export const NodeTimeBadge = ({
  created_at,
  updated_at,
}: {
  created_at: moment.Moment
  updated_at: moment.Moment
}) => {
  let tooltip = `Created ${formatFullDate(created_at)}`
  if (!created_at.isSame(updated_at)) {
    tooltip += `, updated ${formatFullDate(updated_at)}`
  }
  return (
    <Badge>
      <Column>
        <HoverTooltip tooltip={tooltip}>
          <CreatedAt>{formatDate(created_at)}</CreatedAt>
        </HoverTooltip>
      </Column>
    </Badge>
  )
}
