import styles from "./components.module.css";

import { Link as ReactRouterLink } from "react-router-dom";

export const Link = (props) => {
  const { url } = props.contentState.getEntity(
    props.entityKey
  ).getData();
  if (url.match(/^\w+$/)) {
    return (
      <ReactRouterLink
        to={url}
        className={styles.inline_link}
      >
        {props.children}
      </ReactRouterLink>
    );
  } else {
    return (
      <a href={url} className={styles.inline_link}>
        {props.children}
      </a>
    );
  }
};
