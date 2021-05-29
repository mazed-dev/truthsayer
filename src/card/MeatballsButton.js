import React from "react";

import { Button } from "react-bootstrap";

import styles from "./MeatballsButton.module.css";

import EllipsisImg from "./../img/ellipsis.png";

import { joinClasses } from "../util/elClass.js";

import { HoverTooltip } from "../lib/tooltip";

export const MeatballsButton = React.forwardRef(
  ({ children, onClick, className }, ref) => (
    <Button
      variant="light"
      className={joinClasses(styles.tool_button, className)}
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      {children}
      <HoverTooltip tooltip={"More"}>
        <img
          src={EllipsisImg}
          className={styles.tool_button_img}
          alt={"More"}
        />
      </HoverTooltip>
    </Button>
  )
);
