import React from "react";

import { NavLink } from "react-router-dom";

import { EditorBlock, DraftEditorBlock } from "draft-js";

import "./components.css";
import styles from "./Header.module.css";

import { joinClasses } from "../../../util/elClass.js";

export const Header = (props) => {
  const { contentState, block, className, children, blockProps } = props;
  const { nid } = blockProps;
  if (nid) {
    return (
      <NavLink to={"/n/" + nid} className={styles.ref}>
        <EditorBlock {...props} />
      </NavLink>
    );
  }
  return <EditorBlock {...props} />;
};
