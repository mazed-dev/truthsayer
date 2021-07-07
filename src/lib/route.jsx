import { stringify, parse } from 'query-string'

const kLogInPath = '/login'
const kSignUpPath = '/signup'
const kLogOutPath = '/logout'
const kSearchPath = '/search'
const kNodePathPrefix = '/n/'

const kNoticePathPrefix = '/notice/'

const kNoticeErrorPage = 'error'
const kNoticeSeeYouPage = 'miss-you'
const kNoticeLogInToContinue = 'log-in-to-continue'

function gotoSearch({ history, query }) {
  history.push({
    pathname: kSearchPath,
    search: stringify({ q: query }),
  })
}

function getSearchAnchor({ location }) {
  const search =
    location && location.search ? location.search : window.location.search
  const params = parse(search)
  return { query: params.q || '' }
}

function gotoPath(history, path) {
  if (history) {
    // *dbg*/ console.log('History push', path)
    history.push({ pathname: path })
  } else {
    // *dbg*/ console.log('Window location href', path)
    window.location.href = path
  }
}

function gotoLogIn({ history }) {
  gotoPath(history, kLogInPath)
}

function gotoSignUp({ history }) {
  gotoPath(history, kSignUpPath)
}

function gotoLogOut({ history }) {
  gotoPath(history, kLogOutPath)
}

function gotoNode({ history, nid }) {
  gotoPath(history, kNodePathPrefix + nid)
}

function gotoMain({ history }) {
  // *dbg*/ console.log('Go to main')
  gotoPath(history, '/')
}

function gotoError({ history }) {
  // *dbg*/ console.log('Go to error')
  gotoPath(history, kNoticePathPrefix + kNoticeErrorPage)
}

function gotoSeeYou({ history }) {
  gotoPath(history, kNoticePathPrefix + kNoticeSeeYouPage)
}

function gotoLogInToContinue({ history }) {
  gotoPath(history, kNoticePathPrefix + kNoticeLogInToContinue)
}

function getNoticePage({ params }) {
  // *dbg*/ console.log('getNoticePage', params)
  return params
}

export const routes = {
  login: kLogInPath,
  signup: kSignUpPath,
  logout: kLogOutPath,
  search: kSearchPath,
  node: `${kNodePathPrefix}:nid`,
  notice: `${kNoticePathPrefix}:page`,
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
}

export const makeRefTo = {
  node: (nid) => `${kNodePathPrefix}${nid}`,
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
