import React from "react";
import PropTypes from "prop-types";

import {
  Badge,
  Button,
  Overlay,
  Popover,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

import moment from "moment";

import "./MarkDownRender.css";

// https://github.com/rexxars/react-markdown
import ReactMarkdown from "react-markdown";

function MarkdownRoot({ children, ...rest }) {
  return (
    <div {...rest} className="markdown-full-note-body">
      {children}
    </div>
  );
}

function MarkdownHeading({ level, children, ...rest }) {
  var hdr_el;
  // TODO(akindyakov): add markdown title anchors
  switch (level) {
    case 1:
      hdr_el = <h1 {...rest}> {children} </h1>;
      break;
    case 2:
      hdr_el = <h2 {...rest}> {children} </h2>;
      break;
    case 3:
      hdr_el = <h3 {...rest}> {children} </h3>;
      break;
    case 4:
      hdr_el = <h4 {...rest}> {children} </h4>;
      break;
    case 5:
      hdr_el = <h5 {...rest}> {children} </h5>;
      break;
    case 6:
    default:
      hdr_el = <h6 {...rest}> {children} </h6>;
      break;
  }
  return hdr_el;
}

export class DateBadge extends React.Component {
  constructor(props) {
    super(props);
  }

  handleClick = (event) => {};

  render() {
    const date_str = this.props.tm.calendar({
      sameDay: "[Today]",
      nextDay: "[Tomorrow]",
      nextWeek: "dddd",
      lastDay: "[Yesterday]",
      lastWeek: "[Last] dddd",
      sameElse: "YYYY MMMM DD, dddd",
    });
    return (
      <Badge variant="secondary" pill>
        {date_str}
      </Badge>
    );
  }
}

export class TimeBadge extends React.Component {
  constructor(props) {
    super(props);
  }

  handleClick = (event) => {};

  render() {
    var date_str;
    if (!this.props.format || this.props.format === "time") {
      const timeFmt = ", hh:mm";
      date_str = this.props.tm.calendar({
        sameDay: "[Today]" + timeFmt,
        nextDay: "[Tomorrow]" + timeFmt,
        nextWeek: "dddd" + timeFmt,
        lastDay: "[Yesterday]" + timeFmt,
        lastWeek: "[Last] dddd" + timeFmt,
        sameElse: "YYYY MMMM DD, dddd" + timeFmt,
      });
    } else {
      date_str = this.props.tm.format(this.props.format);
    }
    return (
      <Badge variant="secondary" pill>
        {date_str}
      </Badge>
    );
  }
}

TimeBadge.propTypes = {
  format: PropTypes.string,
};

export function DateTimeBadge({ tm, format, children, ...rest }) {
  if (format === "day") {
    return <DateBadge tm={tm} />;
  }
  return <TimeBadge tm={tm} format={format} />;
}

function MarkdownLink({ href, children, ...rest }) {
  href = href.trim();

  if (href.startsWith("@")) {
    const parts = href.match(/^@([0-9]+)\/?(.*)/);
    if (parts) {
      const tm = moment.unix(parts[1]);
      const format = parts[2];
      return <DateTimeBadge tm={tm} format={format} />;
    }
  }

  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export function MdCardRender({ source }) {
  return (
    <ReactMarkdown
      source={source}
      renderers={{
        heading: MarkdownHeading,
        link: MarkdownLink,
        root: MarkdownRoot,
      }}
    />
  );
}

function MarkdownSmallRoot({ children, ...rest }) {
  return (
    <div {...rest} className="markdown-small-card-body">
      {children}
    </div>
  );
}

export function MdSmallCardRender({ source }) {
  return (
    <ReactMarkdown
      source={source}
      renderers={{
        heading: MarkdownHeading,
        link: MarkdownLink,
        root: MarkdownSmallRoot,
      }}
    />
  );
}

export default MdCardRender;
