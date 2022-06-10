import React from 'react'

import { default as styled } from '@emotion/styled'

const Box = styled.div`
  margin: 0;
  margin-right: 0.6em;
  padding: 0;
  display: inline-block;
  position: relative;
  cursor: pointer;
`

const BoxDisabled = styled(Box)`
  cursor: default;
  user-select: none;
`

const CheckBoxUnchecked = styled.div`
  padding: 0;

  margin-right: 0;
  margin-left: 0;
  margin-bottom: 0;
  margin-top: 0.25em;

  height: 1em;
  width: 1em;

  border: 1px solid #8c8c8c;
  border-radius: 0.5em;

  box-shadow: inset 0 0 0.16em rgba(0, 0, 0, 0.492);
  &:hover {
    box-shadow: inset 0 0 0.42em rgba(0, 0, 0, 0.492);
  }
`

const CheckBoxChecked = styled(CheckBoxUnchecked)`
  box-shadow: inset 0 0 0.74em #008000;
  border: none;
  &:after {
    position: absolute;
    left: 0.4em;
    top: 0;
    width: 0.5em;
    height: 1em;
    border: solid white;
    border-width: 0 0.19em 0.19em 0;
    display: block;
    content: '';
    cursor: pointer;

    -webkit-transform: rotate(45deg);
    -moz-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }
`

type CheckBoxProps = {
  className?: string
  checked: boolean
  disabled: boolean
  onChange: React.MouseEventHandler
}

export const CheckBox = React.forwardRef<HTMLDivElement, CheckBoxProps>(
  ({ checked, onChange, className, disabled, ...kwargs }, ref) => {
    const tick = checked ? <CheckBoxChecked /> : <CheckBoxUnchecked />
    if (disabled) {
      return (
        <BoxDisabled className={className} ref={ref} {...kwargs}>
          {tick}
        </BoxDisabled>
      )
    }
    return (
      <Box className={className} onClick={onChange} ref={ref} {...kwargs}>
        {tick}
      </Box>
    )
  }
)
