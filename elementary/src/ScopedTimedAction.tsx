import React from 'react'
import moment from 'moment'

/**
 * Execute an action after a specified amount of time, as long as the component
 * is still mounted/being rendered (or is still "in scope") when the time is up.
 * As soon as the component is unmounted, the action is cancelled.
 *
 * Action is executed once per mount event (in other words, if an action fires then
 * it will not fire again until component unmounts & re-mounts).
 */
export function ScopedTimedAction({
  action,
  after,
}: {
  action: () => void
  after: moment.Duration
}) {
  const [timer] = React.useState(() => setTimeout(action, after.milliseconds()))

  React.useEffect(() => {
    return () => clearTimeout(timer)
  }, [timer])

  return <></>
}
