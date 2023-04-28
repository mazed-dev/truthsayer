import React from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'

import { StyledPublicDoc } from './StyledPublicDoc'

export function ContactUs() {
  return (
    <StyledPublicDoc>
      <ReactMarkdown remarkPlugins={[gfm]}>{_md}</ReactMarkdown>
    </StyledPublicDoc>
  )
}

const _md = `
# Contact

For any questions get in touch with us at [inquiries@mazed.dev](inquiries@mazed.dev).
`
