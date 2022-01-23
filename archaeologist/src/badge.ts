import browser from 'webextension-polyfill'

export async function setActive(status?: boolean) {
  if (status) {
    await browser.browserAction.setIcon({
      path: {
        16: 'logo-16x16.png',
        48: 'logo-48x48.png',
        72: 'logo-72x72.png',
        128: 'logo-128x128.png',
      },
    })
  } else {
    await setInactive()
  }
}

export async function setInactive() {
  await browser.browserAction.setIcon({
    path: {
      16: 'logo-fade-16x16.png',
      48: 'logo-fade-48x48.png',
      72: 'logo-fade-72x72.png',
      128: 'logo-fade-128x128.png',
    },
  })
}

export async function resetText(tabId?: number, text?: string) {
  text = text || ''
  await browser.browserAction.setBadgeText({ text, tabId })
  await browser.browserAction.setBadgeBackgroundColor({
    tabId,
    color: [189, 182, 189, 255],
  })
}
