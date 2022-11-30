import React from 'react'
import { PostHog } from 'posthog-js'

export type ContentContextProps = {
  analytics: PostHog | null
}

export const ContentContext = React.createContext<ContentContextProps>({
  analytics: null,
})
