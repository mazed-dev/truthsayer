/** @jsxImportSource @emotion/react */

import styled from '@emotion/styled'

import { StyleButtonCreate } from 'elementary'

export const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 0;
  border-radius: 32px;
  font-size: 20px;

  display: table;
  padding: 8px 8px 8px 8px;
  margin: 0;

  &:hover {
    background-color: #d0d1d2;
  }
`

export const ButtonCreate = styled(Button)({
  ...StyleButtonCreate,
})
