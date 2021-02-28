import React from "react";

import { Button } from "react-bootstrap";

import { joinClasses } from "../util/elClass.js";

import styles from "./ImgButton.module.css";

// <HoverTooltip tooltip={"More"}>
// </HoverTooltip>

export const ImgButton = React.forwardRef(
  ({ children, onClick, className }, ref) => (
    <Button
      variant="light"
      className={joinClasses(styles.img_button, className)}
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      {children}
    </Button>
  )
);
