export function setActive(status?: boolean) {
  if (status) {
    chrome.action.setIcon({
      path: {
        16: 'logo-16x16.png',
        48: 'logo-48x48.png',
        72: 'logo-72x72.png',
        128: 'logo-128x128.png',
      },
    })
  } else {
    setInactive()
  }
}

export function setInactive() {
  chrome.action.setIcon({
    path: {
      16: 'logo-fade-16x16.png',
      48: 'logo-fade-48x48.png',
      72: 'logo-fade-72x72.png',
      128: 'logo-fade-128x128.png',
    },
  })
}

export function resetText(text?: string) {
  text = text || ''
  chrome.action.setBadgeText({ text })
}
