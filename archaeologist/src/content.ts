/**
 * Extensions that read or write to web pages utilize a
 * [content script](https://developer.browser.com/docs/extensions/mv3/content_scripts/).
 * The content script contains JavaScript that executes in the contexts of a
 * page that has been loaded into the browser. Content scripts read and modify
 * the DOM of web pages the browser visits.
 */
import { productanalytics } from 'armoury'
import { renderPageAugmentationApp } from './content/App'

if (document.URL.indexOf('mazed.se') === -1) {
  // Except when on Mazed's own homepage, content augmentation should
  // try to limit product analytics from auto-capturing any user interactions
  // that do not involve the augmentation itself.
  for (const child of document.body.children) {
    child.classList.add(productanalytics.classExclude())
  }
}

/**
 * Single mount point in a page DOM for Mazed content state.
 */
const mount = document.createElement('div')
mount.id = 'mazed-archaeologist-content-mount'
document.body.appendChild(mount)

renderPageAugmentationApp(mount)
