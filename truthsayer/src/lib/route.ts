import { stringify, parse } from 'query-string'
import { RouteComponentProps } from 'react-router-dom'
import { Optional } from '../util/types'

const kLogInPath = '/login'
const kSignUpPath = '/signup'
const kLogOutPath = '/logout'
const kSearchPath = '/search'
const kEmptyPath = '/empty'
const kNodePathPrefix = '/n/'

const kNoticePathPrefix = '/notice/'

const kNoticeErrorPage = 'error'
const kNoticeSeeYouPage = 'miss-you'
const kNoticeLogInToContinue = 'log-in-to-continue'

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

function gotoPath(history: Optional<History>, path: string) {
  if (history) {
    // *dbg*/ console.log('History push', path)
    history.push({ pathname: path })
  } else {
    // *dbg*/ console.log('Window location href', path)
    window.location.href = path
  }
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

function getNoticePage({ params }) {
  // *dbg*/ console.log('getNoticePage', params)
  return params
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
  reload: reload_,
}

export const makeRefTo = {
  node: (nid: string) => `${kNodePathPrefix}${nid}`,
}

export const compass = {
  search: {
    get: getSearchAnchor,
  },
  notice: {
    get: getNoticePage,
  },
}

export const notice = {
  error: kNoticeErrorPage,
  seeYou: kNoticeSeeYouPage,
  logInToContinue: kNoticeLogInToContinue,
}
