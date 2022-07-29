import React from 'react'
import { log } from 'armoury'

/**
 * ErrorBoundary class for content App
 * https://reactjs.org/docs/error-boundaries.html
 */
export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError(error: any) {
    log.error('/ContentApp', error)
    return { hasError: true }
  }
  componentDidCatch(error: any, errorInfo: any) {
    log.error('/ContentApp', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}
