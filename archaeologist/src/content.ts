/**
 * Extensions that read or write to web pages utilize a
 * [content script](https://developer.browser.com/docs/extensions/mv3/content_scripts/).
 * The content script contains JavaScript that executes in the contexts of a
 * page that has been loaded into the browser. Content scripts read and modify
 * the DOM of web pages the browser visits.
 */
import { renderPageAugmentationApp } from './content/App'

/**
 * Single mount point in a page DOM for Foreword content state.
 */
const mount = document.createElement('div')
mount.id = 'mazed-archaeologist-content-mount'
document.body.appendChild(mount)

renderPageAugmentationApp(mount)
