import React from "react";

import { Button, ButtonToolbar, ButtonGroup, Dropdown } from "react-bootstrap";

import styles from "./Footbar.module.css";

import { MeatballsButton } from "./MeatballsButton";

import { joinClasses } from "../util/elClass.js";

export const FootbarDropdown = React.forwardRef(
  ({ children, onClick, className }, ref) => (
    <Dropdown
      as={ButtonGroup}
      ref={ref}
      className={joinClasses(styles.toolbar_layout_item, className)}
    >
      {children}
    </Dropdown>
  )
);

export const FootbarDropdownToggle = React.forwardRef(
  ({ children, className }, ref) => (
    <Dropdown.Toggle
      variant="light"
      className={joinClasses(
        styles.tool_button,
        styles.tool_dropdown,
        className
      )}
    >
      {children}
    </Dropdown.Toggle>
  )
);

export const FootbarDropdownToggleMeatballs = React.forwardRef(
  ({ children, className, id }, ref) => (
    <Dropdown.Toggle
      variant="light"
      className={joinClasses(styles.tool_button, styles.tool_dropdown)}
      id={id}
      as={MeatballsButton}
    />
  )
);

export const FootbarDropdownMenu = React.forwardRef(
  ({ children, className }) => <Dropdown.Menu>{children}</Dropdown.Menu>
);

export const FootbarDropdownItem = React.forwardRef(
  ({ children, className, onClick }) => (
    <Dropdown.Item
      className={joinClasses(styles.footbar_dropdown_item, className)}
      onClick={onClick}
    >
      {children}
    </Dropdown.Item>
  )
);

export const FootbarDropdownDivider = React.forwardRef(({ className }) => (
  <Dropdown.Divider />
));
