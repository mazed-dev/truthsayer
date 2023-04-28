import React from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'

import { StyledPublicDoc } from './StyledPublicDoc'

export function AboutMazed() {
  return (
    <StyledPublicDoc>
      <ReactMarkdown remarkPlugins={[gfm]}>{_md}</ReactMarkdown>
    </StyledPublicDoc>
  )
}

const _md = `
# About

Our team of engineers and product managers, hailing from leading tech companies like Meta and Bloomberg, experienced the constant need to search for relevant links they'd previously encountered in order to share with colleagues. This constant interruption took them away from the work they loved to do. We built Mazed to address this challenge.

Mazed serves as your second brain. It effortlessly retains everything you read, allowing you to reference any content you've encountered, without needing to search for it. Seamlessly overlaying your existing workflows, Mazed suggests relevant links, docs, and quotes you've previously come across, while you read and write.

By providing quick access to previously seen information without the need for searching, Mazed prevents interruptions to your daily workflows and boosts productivity.

Mazed is specifically designed for individuals in security-conscious organizations. We do not sell data. And even further, we utilize local storage, ensuring that no sensitive information ever leaves your device, or hits our servers. We operate on a freemium model for individual users to try and use Mazed, and generate revenue from teams subscriptions for groups of users who want additional collaboration tools.

We're building a world where our personal knowledge works for us, rather than for the interests of larger companies whose goals are to engage, retain, and monetize on our attention.

If you're interested in learning more, please check out our [Terms of Service](https://mazed.se/terms-of-service) and [Privacy Policy](./privacy-policy), or get in touch with us at [inquiries@mazed.dev](inquiries@mazed.dev) 🧵
`
