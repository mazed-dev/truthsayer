import React from "react";

import { Button } from "react-bootstrap";

import { joinClasses } from "../util/elClass.js";

import styles from "./ImgButton.module.css";

export const ImgButton = React.forwardRef(
  ({ children, onClick, className, is_disabled }, ref) => (
    <Button
      variant="light"
      className={joinClasses(styles.img_button, className)}
      ref={ref}
      disabled={is_disabled}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      {children}
    </Button>
  )
);
