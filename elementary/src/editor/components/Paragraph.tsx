import React from 'react'
import styled from '@emotion/styled'
import { useReadOnly } from 'slate-react'
import { ParagraphBox } from './components'

import lodash from 'lodash'

const TipBox = styled.span`
  position: absolute;
  opacity: 0.32;
  margin-left: 2px;

  &:after {
    content: 'Add a note...';
    cursor: text;
  }

  pointer-events: none;

  display: none;
  p:only-of-type & {
    display: inline;
  }
`

type ParagraphProps = React.PropsWithChildren<{
  className?: string
  element: any
}>

export const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, children, element, ...attributes }, ref) => {
    const readOnly = useReadOnly()
    let tip
    if (React.Children.count(children) === 1) {
      const text = lodash.get(
        React.Children.toArray(children)[0],
        'props.text.text'
      )
      if (!readOnly && text === '') {
        tip = <TipBox contentEditable={false} />
      }
    }
    return (
      <ParagraphBox ref={ref} className={className} {...attributes}>
        {tip}
        {children}
      </ParagraphBox>
    )
  }
)
