import React from "react";

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

export function MdCardRender({ source }) {
  return (
    <ReactMarkdown
      source={source}
      renderers={{
        heading: MarkdownHeading,
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
        root: MarkdownSmallRoot,
      }}
    />
  );
}

export default MdCardRender;
