import browser from 'webextension-polyfill'

export async function setActive(status?: boolean) {
  if (status) {
    await browser.action.setIcon({
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
  await browser.action.setIcon({
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
  await browser.action.setBadgeText({ text, tabId })
  await browser.action.setBadgeBackgroundColor({
    tabId,
    color: [148, 148, 148, 255],
  })
}
