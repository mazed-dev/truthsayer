import React from 'react'
import { default as styled } from '@emotion/styled'

const ImageBox = styled.img`
  display: block;
  max-width: 100%;
  max-height: 20em;
  box-shadow: 'none';
`

type ImageProps = React.PropsWithChildren<{
  isEditable: boolean
  attributes: any
  element: any
}>

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ attributes, children, element }, ref) => {
    const { link, url } = element
    const src = url || link
    return (
      <div {...attributes}>
        <div contentEditable={false}>
          <ImageBox src={src} ref={ref} />
        </div>
        {children}
      </div>
    )
  }
)
