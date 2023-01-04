import React, { PropsWithChildren } from 'react'

import { ButtonGroup, Dropdown } from 'react-bootstrap'

import styles from './Footbar.module.css'

import { MeatballsButton } from './MeatballsButton'

import { jcss } from 'elementary'

export const FootbarDropdown = React.forwardRef<
  any,
  PropsWithChildren<{ className: string }>
>(({ children, className }, ref) => (
  <Dropdown
    as={ButtonGroup}
    ref={ref}
    className={jcss(styles.toolbar_layout_item, className)}
  >
    {children}
  </Dropdown>
))

export const FootbarDropdownToggle = React.forwardRef<
  any,
  { className: string }
>(({ children, className }, _ref) => (
  <Dropdown.Toggle
    variant="light"
    className={jcss(styles.tool_button, styles.tool_dropdown, className)}
  >
    {children}
  </Dropdown.Toggle>
))

export const FootbarDropdownToggleMeatballs = React.forwardRef<
  any,
  { id: string }
>(({ id }, _ref) => (
  <Dropdown.Toggle
    variant="light"
    className={jcss(styles.tool_button, styles.tool_dropdown)}
    id={id}
    as={MeatballsButton}
  />
))

export const FootbarDropdownMenu = ({ children }: PropsWithChildren<{}>) => (
  <Dropdown.Menu>{children}</Dropdown.Menu>
)

export const FootbarDropdownItem = ({
  children,
  className,
  onClick,
}: PropsWithChildren<{
  className: string
  onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void
}>) => (
  <Dropdown.Item
    className={jcss(styles.footbar_dropdown_item, className)}
    onClick={onClick}
  >
    {children}
  </Dropdown.Item>
)

export const FootbarDropdownDivider = () => <Dropdown.Divider />
