import React from 'react'

import { Card } from 'react-bootstrap'

import moment from 'moment'

import { DateTimeBadge } from './../markdown/MarkdownRender'
import { SmallCard } from './../card/SmallCard'

class DateTimeSmartItem extends React.Component {
  handleSumbit = () => {
    const replacement = `[](@${this.props.tm.unix()}/${this.props.format})`
    this.props.on_insert({
      replacement,
    })
  }

  render() {
    return (
      <SmallCard onClick={this.handleSumbit}>
        <Card.Header>{`Date: ${this.props.label}`}</Card.Header>
        <Card.Body>
          <DateTimeBadge tm={this.props.tm} format={this.props.format} />
        </Card.Body>
      </SmallCard>
    )
  }
}

function createDateTimeSmartItem({
  tm,
  format,
  label,
  on_insert,
  cards,
  usedTms,
}) {
  if (!tm.isValid()) {
    return
  }
  const uTm = tm.unix()
  if (usedTms.has(uTm)) {
    return
  }
  usedTms.add(uTm)
  cards.push(
    <DateTimeSmartItem
      tm={tm}
      format={format}
      label={label}
      on_insert={on_insert}
      ref={React.createRef()}
      key={`smart/date/insert/${uTm}`}
    />
  )
}

const DEF_FMT = 'YYYY-MMMM-DD'

export function dateTimeSmartItemSearch(input, on_insert) {
  const cards = []
  const usedTms = new Set()
  if (input.match(/^(now|date)/i)) {
    createDateTimeSmartItem({
      tm: moment(),
      format: 'time',
      label: 'now',
      on_insert,
      cards,
      usedTms,
    })
  } else if (input.match(/^toda?y?/i)) {
    createDateTimeSmartItem({
      tm: moment(),
      format: 'day',
      label: 'today',
      on_insert,
      cards,
      usedTms,
    })
  } else if (input.match(/^yeste?r?d?a?y?/i)) {
    createDateTimeSmartItem({
      tm: moment().subtract(1, 'days'),
      format: 'day',
      label: 'yesterday',
      on_insert,
      cards,
      usedTms,
    })
  } else if (input.match(/^tomor?r?o?w?/i)) {
    createDateTimeSmartItem({
      tm: moment().add(1, 'days'),
      format: 'day',
      label: 'tomorrow',
      on_insert,
      cards,
      usedTms,
    })
  } else {
    createDateTimeSmartItem({
      tm: moment(input, 'YYYY-MM-DD'),
      format: DEF_FMT,
      label: '',
      on_insert,
      cards,
      usedTms,
    })
    createDateTimeSmartItem({
      tm: moment(input, 'DD-MM-YYYY'),
      format: DEF_FMT,
      label: '',
      on_insert,
      cards,
      usedTms,
    })
    createDateTimeSmartItem({
      tm: moment(input, 'DD-MM-YY'),
      format: DEF_FMT,
      label: '',
      on_insert,
      cards,
      usedTms,
    })
    createDateTimeSmartItem({
      tm: moment(input, 'DD-MMMM-YY'),
      format: DEF_FMT,
      label: '',
      on_insert,
      cards,
      usedTms,
    })
  }
  // TODO(akindyakov): Place all suggested dates into a single card as a list with individual "insert" button for each date
  return cards
}

export default DateTimeSmartItem
