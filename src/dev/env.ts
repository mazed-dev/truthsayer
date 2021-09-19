function _initDevEnv(): void {
  const head = document.getElementsByTagName('head')[0]
  for (const element of head.getElementsByTagName('link')) {
    if (
      element.rel === 'icon' ||
      element.rel === 'alternate icon' ||
      element.rel === 'apple-touch-icon'
    ) {
      element.href = '/logo-dev-72x72.png'
      element.type = 'image/png'
    }
  }
}

export function initDevEnv(): void {
  switch (process.env.NODE_ENV) {
    case 'production':
      break
    case 'development':
      _initDevEnv()
      break
    case 'test':
      break
    default:
      break
  }
}

export function getLogoImage(): string {
  switch (process.env.NODE_ENV) {
    case 'development':
      return '/logo-dev-strip.svg'
  }
  return '/logo-strip.svg'
}
