import { PostHog } from 'posthog-js'
import type { StorageApi } from 'smuggler-api'

/**
 * @summary An emulation of the React.useContext() functionality from other
 * parts of the application.
 *
 * @description Since widgets in 'elementary' don't know in which environment
 * they'll be used, it's unclear hot to leverage useContext(). But the basic
 * end result can be achieved through prop drilling (see
 * https://dev.to/codeofrelevancy/what-is-prop-drilling-in-react-3kol for more
 * info about the term)
 */
export type ElementaryContext = {
  storage: StorageApi
  analytics?: PostHog
}
