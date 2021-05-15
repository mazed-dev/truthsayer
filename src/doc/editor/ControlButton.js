import React from "react";

import styles from "./ControlButton.module.css";

import { joinClasses } from "../../util/elClass.js";

export function ControlButton({ children, className, onClick, isActive }) {
  className = joinClasses(className || "", styles.btn);
  if (isActive) {
    className = joinClasses(className, styles.btn_active);
  }
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}

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
