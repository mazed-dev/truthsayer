import React from 'react'

import styled from '@emotion/styled'

import { useSelected } from 'slate-react'

import { ParagraphBox } from './components'

import lodash from 'lodash'

const ParagraphBoxWitTip = styled(ParagraphBox)`
  &:after {
    content: 'Type // to open an auto suggestion dialogue...';
    opacity: 0.32;
    margin-left: 2px;
  }
`

type ParagraphProps = React.PropsWithChildren<{
  className?: string
}>

export const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, children, ...attributes }, ref) => {
    const selected = useSelected()
    // @ts-ignore: Property 'length' does not exist on type 'ReactNode'
    if (selected && children?.length === 1) {
      // @ts-ignore: expression of type '0' can't be used to index type 'ReactNode'
      const text = lodash.get(children[0], 'props.text.text')
      if (text === '') {
        return (
          <ParagraphBoxWitTip ref={ref} className={className} {...attributes}>
            {children}
          </ParagraphBoxWitTip>
        )
      }
    }
    return (
      <ParagraphBox ref={ref} className={className} {...attributes}>
        {children}
      </ParagraphBox>
    )
  }
)
