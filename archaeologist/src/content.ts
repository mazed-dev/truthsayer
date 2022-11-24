/**
 * Extensions that read or write to web pages utilize a
 * [content script](https://developer.browser.com/docs/extensions/mv3/content_scripts/).
 * The content script contains JavaScript that executes in the contexts of a
 * page that has been loaded into the browser. Content scripts read and modify
 * the DOM of web pages the browser visits.
 */
import { productanalytics } from 'armoury'
import { renderPageAugmentationApp } from './content/App'

// Do not track any user interactions with non-Mazed elements of a
// web page.
for (const child of document.body.children) {
  child.classList.add(productanalytics.classExclude())
}

/**
 * Single mount point in a page DOM for Mazed content state.
 */
const mount = document.createElement('div')
mount.id = 'mazed-archaeologist-content-mount'
document.body.appendChild(mount)

renderPageAugmentationApp(mount)
