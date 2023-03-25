import { stringify, parse } from 'query-string'
import { RouteComponentProps } from 'react-router-dom'
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
  | '/privacy-policy'
  | '/search'
  | '/settings'
  | '/signup'
  | '/terms-of-service'
  | '/user-encryption'
  | '/user-preferences'
  | '/account/create/waiting-for-approval'
  | '/account/create/go-to-inbox-to-confirm-email'
  | '/onboarding'
  | '/browser-history-import-loading-screen'

const kLogInPath: TruthsayerPath = '/login'
const kSignUpPath: TruthsayerPath = '/signup'
const kLogOutPath: TruthsayerPath = '/logout'
const kSearchPath: TruthsayerPath = '/search'
const kEmptyPath: TruthsayerPath = '/empty'
const kNodePathPrefix = '/n/'
const kWaitingForApproval: TruthsayerPath =
  '/account/create/waiting-for-approval'

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

export type History = RouteComponentProps['history']
export type Location = RouteComponentProps['location']

function gotoSearch({ history, query }: { history: History; query: string }) {
  history.push({
    pathname: kSearchPath,
    search: stringify({ q: query }),
  })
}

function gotoOnboarding({
  history,
  step,
}: {
  history?: History
  step?: number
}) {
  if (history) {
    history.push({ pathname: kOnboarding, search: stringify({ step }) })
  } else {
    window.location.pathname = kOnboarding
  }
}

function getSearchAnchor({ location }: { location: Location }) {
  const search =
    location && location.search ? location.search : window.location.search
  const params = parse(search)
  return { query: params.q || '' }
}

function gotoPath(history: Optional<History>, path: string, state?: any) {
  if (history) {
    // *dbg*/ console.log('History push', path)
    history.push(path, state)
  } else {
    // *dbg*/ console.log('Window location href', path)
    window.location.href = path
  }
}

function goToTruthsayerPath(
  path: TruthsayerPath,
  params?: {
    history?: History
    state?: any
  }
) {
  gotoPath(params?.history ?? null, path, params?.state ?? null)
}

export interface GoToInboxToConfirmEmailLocationState {
  name?: string
  email?: string
}

function goToInboxToConfirmEmail({
  history,
  state,
}: {
  history?: History
  state: GoToInboxToConfirmEmailLocationState
}) {
  goToTruthsayerPath('/account/create/go-to-inbox-to-confirm-email', {
    state,
    history,
  })
}

type HistoryObj = { history?: Optional<History> }

function gotoLogIn({ history }: HistoryObj) {
  gotoPath(history ?? null, kLogInPath)
}

function gotoSignUp({ history }: HistoryObj) {
  gotoPath(history ?? null, kSignUpPath)
}

function gotoLogOut({ history }: HistoryObj) {
  gotoPath(history ?? null, kLogOutPath)
}

function gotoNode({ history, nid }: { history: History; nid: string }) {
  gotoPath(history ?? null, kNodePathPrefix + nid)
}

function gotoMain({ history }: HistoryObj) {
  // *dbg*/ console.log('Go to main')
  gotoPath(history ?? null, '/')
}

function gotoError({ history }: HistoryObj) {
  // *dbg*/ console.log('Go to error')
  gotoPath(history ?? null, kNoticePathPrefix + kNoticeErrorPage)
}

function gotoSeeYou({ history }: HistoryObj) {
  gotoPath(history ?? null, kNoticePathPrefix + kNoticeSeeYouPage)
}

function gotoLogInToContinue({ history }: HistoryObj) {
  gotoPath(history ?? null, kNoticePathPrefix + kNoticeLogInToContinue)
}

function gotoWaitingListNotice(history: History, state?: any) {
  gotoPath(history, kNoticePathPrefix + kNoticeYouAreInWaitingList, state)
}

function gotoWaitingForApproval(history?: History, state?: any) {
  gotoPath(history ?? null, kWaitingForApproval, state)
}

function reload_(history: History) {
  history.push({ pathname: kEmptyPath })
  history.goBack()
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
  waitingForApproval: gotoWaitingForApproval,
  reload: reload_,
  goToInboxToConfirmEmail,
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
