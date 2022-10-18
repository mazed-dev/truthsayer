import { stringify, parse } from 'query-string'
import { RouteComponentProps } from 'react-router-dom'
import { Optional } from 'armoury'

export type MazedPath =
  | '/'
  | '/external-import'
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

const kLogInPath: MazedPath = '/login'
const kSignUpPath: MazedPath = '/signup'
const kLogOutPath: MazedPath = '/logout'
const kSearchPath: MazedPath = '/search'
const kEmptyPath: MazedPath = '/empty'
const kNodePathPrefix = '/n/'
const kWaitingForApproval: MazedPath = '/account/create/waiting-for-approval'

const kNoticePathPrefix: MazedPath = '/notice/'

const kNoticeErrorPage = 'error'
const kNoticeSeeYouPage = 'miss-you'
const kNoticeLogInToContinue = 'log-in-to-continue'

const kSettings: MazedPath = '/user-preferences'
const kApps = '/apps-to-install'
const kIntegrations: MazedPath = '/external-import'
const kFaq: MazedPath = '/faq'
const kApi: MazedPath = '/api'
const kAbout: MazedPath = '/about'
const kContacts: MazedPath = '/contacts'
const kPrivacyPolicy: MazedPath = '/privacy-policy'
const kTermsOfService: MazedPath = '/terms-of-service'

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

function goToMazedPath(
  path: MazedPath,
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
  goToMazedPath('/account/create/go-to-inbox-to-confirm-email', {
    state,
    history,
  })
}

type HistoryObj = { history: Optional<History> }

function gotoLogIn({ history }: HistoryObj) {
  gotoPath(history, kLogInPath)
}

function gotoSignUp({ history }: HistoryObj) {
  gotoPath(history, kSignUpPath)
}

function gotoLogOut({ history }: HistoryObj) {
  gotoPath(history, kLogOutPath)
}

function gotoNode({ history, nid }: { history: History; nid: string }) {
  gotoPath(history, kNodePathPrefix + nid)
}

function gotoMain({ history }: HistoryObj) {
  // *dbg*/ console.log('Go to main')
  gotoPath(history, '/')
}

function gotoError({ history }: HistoryObj) {
  // *dbg*/ console.log('Go to error')
  gotoPath(history, kNoticePathPrefix + kNoticeErrorPage)
}

function gotoSeeYou({ history }: HistoryObj) {
  gotoPath(history, kNoticePathPrefix + kNoticeSeeYouPage)
}

function gotoLogInToContinue({ history }: HistoryObj) {
  gotoPath(history, kNoticePathPrefix + kNoticeLogInToContinue)
}

function gotoWaitingForApproval(history?: History, state?: any) {
  gotoPath(history || null, kWaitingForApproval, state)
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
}

export const goto = {
  default: gotoMain,
  login: gotoLogIn,
  signup: gotoSignUp,
  logout: gotoLogOut,
  node: gotoNode,
  search: gotoSearch,
  notice: {
    error: gotoError,
    seeYou: gotoSeeYou,
    logInToContinue: gotoLogInToContinue,
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
}
