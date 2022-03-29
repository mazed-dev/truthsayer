import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

import styled from '@emotion/styled'

const Box = styled.div`
  background-color: grey;
  color: green;
`
export const QuoteHint = () => {
  return <Box>[Mazed]</Box>
}


export const QuoteMark = ({
  path,
  children,
}: React.PropsWithChildren<{ path: string }>) => {
  const element = document.createElement('div')
  const target = document.querySelector(path)

  useEffect(() => {
    target?.appendChild(element)
    return () => {
      target?.removeChild(element)
    }
  })
  return ReactDOM.createPortal(children, element)
}
