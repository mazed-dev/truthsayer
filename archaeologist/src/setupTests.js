// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// If chrome.runtime.id is not set, 'webextension-polyfill' will throw the
// following error: "This script should only be loaded in a browser extension"
// See https://github.com/mozilla/webextension-polyfill/issues/218#issuecomment-584894114
// for more information.
if (!chrome.runtime) chrome.runtime = {}
if (!chrome.runtime.id) chrome.runtime.id = 'testid'
