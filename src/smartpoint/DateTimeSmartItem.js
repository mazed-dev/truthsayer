import React from "react";

import {
  Button,
  Row,
  Col,
  Badge,
} from "react-bootstrap";

import moment from "moment";

export class DateTimeSmartItem extends React.Component {
  constructor(props) {
    super(props);
    this.replacement = "[](@" + this.props.tm.unix() + ")";
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
          <Badge variant="secondary" pill>
            {date_str}
          </Badge>
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

export function dateTimeSmartItemSearch(input, on_insert) {
  var ret = [];
  const today = input.match(/^(toda?y?|now)/i);
  if (today) {
    const tm = moment();
    ret.push((
      <DateTimeSmartItem tm={tm} label={"Now"} on_insert={on_insert} ref={React.createRef()} />
    ));
  }
  const yesterday = input.match(/^yeste?r?d?a?y?/i);
  if (yesterday) {
    const tm = moment().subtract(1, "days");
    ret.push((
      <DateTimeSmartItem tm={tm} label={"Yesterday"} on_insert={on_insert} ref={React.createRef()} />
    ));
  }
  const tomorrow = input.match(/^tomor?r?o?w?/i);
  if (tomorrow) {
    const tm = moment().add(1, "days");
    ret.push((
      <DateTimeSmartItem tm={tm} label={"Tomorrow"} on_insert={on_insert} ref={React.createRef()} />
    ));
  }
  const yyyy_mm_dd = moment(input, 'YYYY-MM-DD');
  if (yyyy_mm_dd.isValid()) {
    ret.push((
      <DateTimeSmartItem tm={yyyy_mm_dd} label={"Date"} on_insert={on_insert} ref={React.createRef()} />
    ));
  }

  const dd_mm_yyyy = moment(input, 'DD-MM-YYYY');
  if (dd_mm_yyyy.isValid()) {
    ret.push((
      <DateTimeSmartItem tm={dd_mm_yyyy} label={"Date"} on_insert={on_insert} ref={React.createRef()} />
    ));
  }

  const dd_mm_yy = moment(input, 'DD-MM-YY');
  if (dd_mm_yy.isValid()) {
    ret.push((
      <DateTimeSmartItem tm={dd_mm_yy} label={"Date"} on_insert={on_insert} ref={React.createRef()} />
    ));
  }

  return ret;
}

export default DateTimeSmartItem;
