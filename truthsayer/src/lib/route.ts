import { stringify, parse } from 'query-string'
import { NavigateFunction, Location } from 'react-router-dom'
import { Optional } from 'armoury'

export type TruthsayerPath =
  | '/'
  | '/external-import'
  | '/export'
  | '/about'
  | '/account'
  | '/api'
  | '/apps-to-install'
  | '/contacts'
  | '/cookie-policy'
  | '/empty'
  | '/faq'
  | '/help'
  | '/login'
  | '/logout'
  | '/n/:nid' // See TriptychUrlParams
  | '/notice/'
  | '/notice/:page' // See NoticeUrlParams
  | '/password-recover-change'
  | '/password-recover-request'
  | '/password-recover-reset/:token' // See PasswordRecoverFormUrlParams
  | '/passwd/set/:token' // Set a password for a new account
  | '/privacy-policy'
  | '/search'
  | '/settings'
  | '/signup'
  | '/terms-of-service'
  | '/user-encryption'
  | '/user-preferences'
  | '/onboarding'
  | '/browser-history-import-loading-screen'

const kLogInPath: TruthsayerPath = '/login'
const kSignUpPath: TruthsayerPath = '/signup'
const kLogOutPath: TruthsayerPath = '/logout'
const kSearchPath: TruthsayerPath = '/search'
const kEmptyPath: TruthsayerPath = '/empty'
const kNodePathPrefix = '/n/'

const kNoticePathPrefix: TruthsayerPath = '/notice/'

const kNoticeErrorPage = 'error'
const kNoticeSeeYouPage = 'miss-you'
const kNoticeLogInToContinue = 'log-in-to-continue'
const kNoticeYouAreInWaitingList = 'waiting-list'

const kSettings: TruthsayerPath = '/user-preferences'
const kApps = '/apps-to-install'
const kIntegrations: TruthsayerPath = '/external-import'
const kFaq: TruthsayerPath = '/faq'
const kApi: TruthsayerPath = '/api'
const kAbout: TruthsayerPath = '/about'
const kContacts: TruthsayerPath = '/contacts'
const kPrivacyPolicy: TruthsayerPath = '/privacy-policy'
const kTermsOfService: TruthsayerPath = '/terms-of-service'
const kCookiePolicy: TruthsayerPath = '/cookie-policy'
const kOnboarding: TruthsayerPath = '/onboarding'
const kBrowserHistoryImportLoadingScreen: TruthsayerPath =
  '/browser-history-import-loading-screen'

export type PasswordRecoverFormUrlParams = { token: string }
export type TriptychUrlParams = { nid: string }
export type NoticeUrlParams = { page: string }

export type { Location }

function gotoSearch({
  navigate,
  query,
}: {
  navigate?: NavigateFunction
  query: string
}) {
  if (navigate) {
    navigate({
      pathname: kSearchPath,
      search: stringify({ q: query }),
    })
  } else {
    window.location.assign(`${kSearchPath}?${stringify({ q: query })}`)
  }
}

function gotoOnboarding({
  navigate,
  step,
}: {
  navigate?: NavigateFunction
  step?: number
}) {
  if (navigate) {
    navigate({ pathname: kOnboarding, search: stringify({ step }) })
  } else {
    window.location.href = `${kOnboarding}?${stringify({ step })}`
  }
}

function getSearchAnchor({ location }: { location: Location }) {
  const search =
    location && location.search ? location.search : window.location.search
  const params = parse(search)
  return { query: params.q || '' }
}

function gotoPath(
  navigate: Optional<NavigateFunction>,
  path: string,
  search?: string,
  state?: any
) {
  if (search != null && !search.startsWith('?')) {
    search = `?${search}`
  }
  if (navigate) {
    navigate({ pathname: path, search }, { state })
  } else {
    window.location.href = `${path}${search}`
  }
}

type HavigateObj = { navigate?: Optional<NavigateFunction> }

type OnboardingOpts = { onboarding?: boolean }

function gotoLogIn({ navigate, onboarding }: HavigateObj & OnboardingOpts) {
  gotoPath(navigate ?? null, kLogInPath, stringify({ onboarding }))
}

function gotoSignUp({ navigate }: HavigateObj) {
  gotoPath(navigate ?? null, kSignUpPath)
}

function gotoLogOut({ navigate }: HavigateObj) {
  gotoPath(navigate ?? null, kLogOutPath)
}

function gotoNode({
  navigate,
  nid,
}: {
  navigate: NavigateFunction
  nid: string
}) {
  gotoPath(navigate ?? null, kNodePathPrefix + nid)
}

function gotoMain({ navigate }: HavigateObj) {
  // *dbg*/ console.log('Go to main')
  gotoPath(navigate ?? null, '/')
}

function gotoError({ navigate }: HavigateObj) {
  // *dbg*/ console.log('Go to error')
  gotoPath(navigate ?? null, kNoticePathPrefix + kNoticeErrorPage)
}

function gotoSeeYou({ navigate }: HavigateObj) {
  gotoPath(navigate ?? null, kNoticePathPrefix + kNoticeSeeYouPage)
}

function gotoLogInToContinue({ navigate }: HavigateObj) {
  gotoPath(navigate ?? null, kNoticePathPrefix + kNoticeLogInToContinue)
}

function gotoWaitingListNotice(navigate: NavigateFunction, state?: any) {
  gotoPath(
    navigate,
    kNoticePathPrefix + kNoticeYouAreInWaitingList,
    undefined,
    state
  )
}

export const routes = {
  login: kLogInPath,
  signup: kSignUpPath,
  logout: kLogOutPath,
  search: kSearchPath,
  node: `${kNodePathPrefix}:nid`,
  notice: `${kNoticePathPrefix}:page`,
  empty: kEmptyPath,
  settings: kSettings,
  apps: kApps,
  integrations: kIntegrations,
  faq: kFaq,
  api: kApi,
  about: kAbout,
  contacts: kContacts,
  privacy: kPrivacyPolicy,
  terms: kTermsOfService,
  cookiePolicy: kCookiePolicy,
  onboarding: kOnboarding,
  browserHistoryImportLoadingScreen: kBrowserHistoryImportLoadingScreen,
}

export const goto = {
  default: gotoMain,
  login: gotoLogIn,
  signup: gotoSignUp,
  logout: gotoLogOut,
  node: gotoNode,
  search: gotoSearch,
  onboarding: gotoOnboarding,
  notice: {
    error: gotoError,
    seeYou: gotoSeeYou,
    logInToContinue: gotoLogInToContinue,
    youAreInWaitingList: gotoWaitingListNotice,
  },
  about: () => {
    window.location.href = 'https://thinkforeword.com/about'
    return null
  },
  terms: () => {
    window.location.href = 'https://thinkforeword.com/foreword-termsofservice'
    return null
  },
  privacy: () => {
    window.location.href = 'https://thinkforeword.com/foreword-privacy-policy'
    return null
  },
  cookiePolicy: () => {
    window.location.href = 'https://thinkforeword.com/foreword-cookies-policy'
    return null
  },
  pricing: () => {
    window.location.href = 'https://thinkforeword.com/pricing'
    return null
  },
  landing: () => {
    window.location.href = 'https://thinkforeword.com/'
    return null
  },
}

export const makeRefTo = {
  node: (nid: string) => `${kNodePathPrefix}${nid}`,
}

export const compass = {
  search: {
    get: getSearchAnchor,
  },
}

export const notice = {
  error: kNoticeErrorPage,
  seeYou: kNoticeSeeYouPage,
  logInToContinue: kNoticeLogInToContinue,
  youAreInWaitingList: kNoticeYouAreInWaitingList,
}

export function truthsayerPath(path: TruthsayerPath): TruthsayerPath {
  return path
}
