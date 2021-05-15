import React from "react";

import { Button } from "react-bootstrap";

import styles from "./ControlButton.module.css";

import { joinClasses } from "../../util/elClass.js";

export const ControlButton = React.forwardRef(
  ({ children, className, onClick, isActive, is_disabled }, ref) => {
    if (isActive) {
      className = joinClasses(className, styles.btn_active);
    }
    return (
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
    );
  }
);

export class ToggleControlButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }
  render() {
    // Custom overrides for "code" style.
    const { className, children, isActive } = this.props;
    return (
      <ControlButton
        className={className}
        onClick={this.onToggle}
        isActive={isActive}
      >
        {children}
      </ControlButton>
    );
  }
}
