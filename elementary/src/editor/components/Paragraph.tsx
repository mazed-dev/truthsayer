import React from 'react'
import styled from '@emotion/styled'
import { useSelected } from 'slate-react'
import { ParagraphBox } from './components'

import lodash from 'lodash'

const TipBox = styled.span`
  position: absolute;
  opacity: 0.32;
  margin-left: 2px;
  &:after {
    content: 'Type // to insert...';
    cursor: text;
  }
`

type ParagraphProps = React.PropsWithChildren<{
  className?: string
}>

export const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, children, ...attributes }, ref) => {
    const selected = useSelected()
    let tip
    // @ts-ignore: Property 'length' does not exist on type 'ReactNode'
    if (selected && children?.length === 1) {
      // @ts-ignore: expression of type '0' can't be used to index type 'ReactNode'
      const text = lodash.get(children[0], 'props.text.text')
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
