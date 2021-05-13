import "./components.css";

import { Link as ReactRouterLink } from "react-router-dom";

import { joinClasses } from "../../util/elClass.js";

export const Link = (props) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();
  if (url.match(/^\w+$/)) {
    return (
      <ReactRouterLink
        to={url}
        className={joinClasses(
          "doc_component_inline_link",
          "doc_component_inline_link_int"
        )}
      >
        {props.children}
      </ReactRouterLink>
    );
  } else {
    return (
      <a
        href={url}
        className={joinClasses(
          "doc_component_inline_link",
          "doc_component_inline_link_ext"
        )}
      >
        {props.children}
      </a>
    );
  }
};
