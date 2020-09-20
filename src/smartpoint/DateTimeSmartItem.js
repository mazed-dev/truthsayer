import React from "react";

import { Button, Row, Col } from "react-bootstrap";

import moment from "moment";

import { DateTimeBadge } from "./../markdown/MarkdownRender";

class DateTimeSmartItem extends React.Component {
  constructor(props) {
    super(props);
    this.replacement =
      "[](@" + this.props.tm.unix() + "/" + this.props.format + ")";
  }

  handleSumbit = () => {
    this.props.on_insert(this.replacement);
  };

  render() {
    const date_str = this.props.tm.calendar();
    return (
      <Row
        className="justify-content-between w-100 p-0 m-0"
        onClick={this.handleSumbit}
      >
        <Col sm md lg xl={8}>
          {this.props.label}
          &nbsp; &ndash; &nbsp;
          <DateTimeBadge tm={this.props.tm} format={this.props.format} />
        </Col>
        <Col sm md lg xl={2}>
          <Button
            variant="outline-success"
            size="sm"
            onClick={this.handleSumbit}
          >
            Insert
          </Button>
        </Col>
      </Row>
    );
  }
}

function createDateTimeSmartItem({ tm, format, label, on_insert }) {
  return (
    <DateTimeSmartItem
      tm={tm}
      format={format}
      label={label}
      on_insert={on_insert}
      ref={React.createRef()}
    />
  );
}

const DEF_FMT = "YYYY-MMMM-DD";

export function dateTimeSmartItemSearch(input, on_insert) {
  var ret = [];
  if (input.match(/^now/i)) {
    const tm = moment();
    ret.push(
      createDateTimeSmartItem({
        tm: tm,
        format: "time",
        label: "Now",
        on_insert: on_insert,
      })
    );
  }
  if (input.match(/^toda?y?/i)) {
    const tm = moment();
    ret.push(
      createDateTimeSmartItem({
        tm: tm,
        format: "day",
        label: "Today",
        on_insert: on_insert,
      })
    );
  }
  if (input.match(/^yeste?r?d?a?y?/i)) {
    const tm = moment().subtract(1, "days");
    ret.push(
      createDateTimeSmartItem({
        tm: tm,
        format: "day",
        label: "Yesterday",
        on_insert: on_insert,
      })
    );
  }
  if (input.match(/^tomor?r?o?w?/i)) {
    const tm = moment().add(1, "days");
    ret.push(
      createDateTimeSmartItem({
        tm: tm,
        format: "day",
        label: "Tomorrow",
        on_insert: on_insert,
      })
    );
  }
  const yyyy_mm_dd = moment(input, "YYYY-MM-DD");
  if (yyyy_mm_dd.isValid()) {
    ret.push(
      createDateTimeSmartItem({
        tm: yyyy_mm_dd,
        format: DEF_FMT,
        label: "Date",
        on_insert: on_insert,
      })
    );
  }

  const dd_mm_yyyy = moment(input, "DD-MM-YYYY");
  if (dd_mm_yyyy.isValid()) {
    ret.push(
      createDateTimeSmartItem({
        tm: dd_mm_yyyy,
        format: DEF_FMT,
        label: "Date",
        on_insert: on_insert,
      })
    );
  }

  const dd_mm_yy = moment(input, "DD-MM-YY");
  if (dd_mm_yy.isValid()) {
    ret.push(
      createDateTimeSmartItem({
        tm: dd_mm_yy,
        format: DEF_FMT,
        label: "Date",
        on_insert: on_insert,
      })
    );
  }

  const dd_mmmm_yy = moment(input, "DD-MMMM-YY");
  if (dd_mmmm_yy.isValid()) {
    ret.push(
      createDateTimeSmartItem({
        tm: dd_mmmm_yy,
        format: DEF_FMT,
        label: "Date",
        on_insert: on_insert,
      })
    );
  }

  return ret;
}

export default DateTimeSmartItem;
