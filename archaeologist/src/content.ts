/**
 * Extensions that read or write to web pages utilize a
 * [content script](https://developer.browser.com/docs/extensions/mv3/content_scripts/).
 * The content script contains JavaScript that executes in the contexts of a
 * page that has been loaded into the browser. Content scripts read and modify
 * the DOM of web pages the browser visits.
 */
import { renderPageAugmentationApp } from './content/App'

/**
 * Single socket point in a web page DOM for all Mazed augmentations
 */
const socket = document.createElement('div')
socket.id = 'mazed-archaeologist-content-socket'
document.body.appendChild(socket)

renderPageAugmentationApp(socket)
