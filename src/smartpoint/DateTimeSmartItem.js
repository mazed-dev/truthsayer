import React from "react";

import { Button, Row, Col } from "react-bootstrap";

import moment from "moment";

import { DateTimeBadge } from "./../markdown/MarkdownRender";
import { GenericSmallCard } from "./../NodeSmallCard";

class DateTimeSmartItem extends React.Component {
  constructor(props) {
    super(props);
  }

  handleSumbit = () => {
    const replacement =
      "[](@" + this.props.tm.unix() + "/" + this.props.format + ")";
    this.props.on_insert(replacement);
  };

  render() {
    return (
      <GenericSmallCard
        onClick={this.handleSumbit}
        header={"Date: " + this.props.label}
      >
        <DateTimeBadge tm={this.props.tm} format={this.props.format} />
      </GenericSmallCard>
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
  console.log("dateTimeSmartItemSearch", input);
  var ret = [];
  if (input.match(/^(now|date)/i)) {
    const tm = moment();
    ret.push(
      createDateTimeSmartItem({
        tm: tm,
        format: "time",
        label: "now",
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
        label: "today",
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
        label: "yesterday",
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
        label: "tomorrow",
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
        label: "",
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
        label: "",
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
        label: "",
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
        label: "",
        on_insert: on_insert,
      })
    );
  }
  //TODO: make dates unique in result array
  //TODO: fit all suggested dates in the single card as a list
  return ret;
}

export default DateTimeSmartItem;
