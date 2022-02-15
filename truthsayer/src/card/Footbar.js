import React from 'react'

import { ButtonGroup, Dropdown } from 'react-bootstrap'

import styles from './Footbar.module.css'

import { MeatballsButton } from './MeatballsButton'

import { jcss } from 'elementary'

export const FootbarDropdown = React.forwardRef(
  ({ children, onClick, className }, ref) => (
    <Dropdown
      as={ButtonGroup}
      ref={ref}
      className={jcss(styles.toolbar_layout_item, className)}
    >
      {children}
    </Dropdown>
  )
)

export const FootbarDropdownToggle = React.forwardRef(
  ({ children, className }, ref) => (
    <Dropdown.Toggle
      variant="light"
      className={jcss(styles.tool_button, styles.tool_dropdown, className)}
    >
      {children}
    </Dropdown.Toggle>
  )
)

export const FootbarDropdownToggleMeatballs = React.forwardRef(
  ({ children, className, id }, ref) => (
    <Dropdown.Toggle
      variant="light"
      className={jcss(styles.tool_button, styles.tool_dropdown)}
      id={id}
      as={MeatballsButton}
    />
  )
)

export const FootbarDropdownMenu = ({ children, className }) => (
  <Dropdown.Menu>{children}</Dropdown.Menu>
)

export const FootbarDropdownItem = ({
  children,
  className,
  as,
  to,
  onClick,
}) => (
  <Dropdown.Item
    className={jcss(styles.footbar_dropdown_item, className)}
    onClick={onClick}
    as={as}
    to={to}
  >
    {children}
  </Dropdown.Item>
)

export const FootbarDropdownDivider = ({ className }) => <Dropdown.Divider />
