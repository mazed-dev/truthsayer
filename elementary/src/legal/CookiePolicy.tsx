import React from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'

import { StyledPublicDoc } from './StyledPublicDoc'

export function CookiePolicy() {
  return(
    <StyledPublicDoc>
      <ReactMarkdown remarkPlugins={[gfm]}>{_md}</ReactMarkdown>
    </StyledPublicDoc>
  )
}

// TODO(akindyakov): Export text from a proper Markdown file
const _md = `
# Cookie Policy

Mazed provides a great deal of transparency regarding how we use your data, how we collect your data, and with whom we share your data. To that end, we provide this page which details how we use cookies.

Mazed uses only essential cookies to provide and secure our websites. Please take a look at our [Privacy Policy]([https://mazed.se/privacy-policy](https://mazed.se/privacy-policy)) if you’d like more information about cookies, and on how and why we use them and cookie-related personal data.

Since the number and names of cookies may change, the table below may be updated from time to time. When it is updated, the data of the repo will change.

| **Provider of Cookie** | **Cookie Name** | **Description** |**Expiration*** |
| ---------------------- | --------------- | --------------- | ---------------|
| mazed.se | \`x-magic-veil\` | This cookie is used to signal to us that the user is already logged in. | 64 hours |
| mazed.se | \`x-magic-seal\` | This cookie is used to log the user in - authorisation cookie. Contains a serialised JSON web token inside. | 64 hours |
| mazed.se | \`x-magic-smuggler-token-last-update\` | This cookie is used to preserve the last update date of the authorisation cookie. | 1 year |

(*) The expiration dates for the cookies listed above generally apply on a rolling basis.

⚠️ Please note while we limit our use of third-party cookies to those necessary to provide external functionality when rendering external content, certain pages on our website may set other third-party cookies. For example, we may embed content, such as videos, from another site that sets a cookie. While we try to minimize these third-party cookies, we can’t always control what cookies this third-party content sets.
`
