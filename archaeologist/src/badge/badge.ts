import browser from 'webextension-polyfill'

// Webextension polyfill doesn't cover this for some reason
const _browserAction = process.env.FIREFOX
  ? browser.browserAction
  : browser.action

export async function setActive(status?: boolean) {
  if (status) {
    await _browserAction.setIcon({
      path: {
        128: 'logo-128x128.png',
        16: 'logo-16x16.png',
        24: 'logo-24x24.png',
        72: 'logo-72x72.png',
      },
    })
  } else {
    //await setInactive()
  }
}

/**
 * Set a string that represents a status of a tab. A tab can only have one status
 * at a time.
 */
export async function setStatus(tabId?: number, status?: string) {
  if (status != null && status.indexOf('|') !== -1) {
    throw new Error(
      `Badge status should not contain '|', that's reserved as separator of activity markers; got '${status}'`
    )
  }
  if (status == null) {
    status = ''
  }

  let text = ''
  const activities = stringifyActivities()
  if (status.length === 0) {
    text = activities
  } else if (activities.length !== 0) {
    text = status + activities
  } else {
    text = status
  }

  await _browserAction.setBadgeText({ text, tabId })
  await _browserAction.setBadgeBackgroundColor({
    tabId,
    color: [189, 182, 189, 255],
  })
}

const activityMarkers = new Map<number /* marker ID */, string>()

async function refreshTextOfAllTabs() {
  const tabs = await browser.tabs.query({})
  for (const tab of tabs) {
    const statusWithActivities = await _browserAction.getBadgeText({
      tabId: tab.id,
    })
    const status = statusWithActivities.split('|', 1)[0]
    await setStatus(tab.id, status)
  }

  const statusWithActivities = await _browserAction.getBadgeText({})
  const status = statusWithActivities.split('|', 1)[0]
  await setStatus(undefined, status)
}

/**
 * Add a string marker that represents an ongoing activity.
 * Marker's presence on a badge is unaffected by calls to @see setStatus()
 */
export async function addActivity(marker: string): Promise<number> {
  const activityId = new Date().getTime()
  activityMarkers.set(activityId, marker)
  await refreshTextOfAllTabs()
  return activityId
}

export async function removeActivity(activityId: number) {
  activityMarkers.delete(activityId)
  await refreshTextOfAllTabs()
}

function stringifyActivities() {
  let ret = ''
  for (const marker of activityMarkers.values()) {
    ret += '|' + marker
  }
  return ret
}
