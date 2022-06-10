import React from 'react'
import { default as styled } from '@emotion/styled'
import { ParagraphBox } from './components.js'

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
}>

export const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, children, ...attributes }, ref) => {
    let tip
    if (React.Children.count(children) === 1) {
      const text = lodash.get(
        React.Children.toArray(children)[0],
        'props.text.text'
      )
      if (text === '') {
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
