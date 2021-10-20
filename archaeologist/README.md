# Mazed browser extension

## Dev

### Build

Build code in following order:

1. `yarn smuggler-api build`
2. `yarn elementary build`
3. `yarn archaeologist build:chrome:local`

### Run: chrome

Extension can be loaded in unpacked mode by following the following steps:

1. Visit [chrome://extensions](chrome://extensions) (via omnibox or "menu" -> "Tools" -> "Extensions").
2. Enable "Developer mode" by ticking the checkbox in the top right corner.
3. Click on the "Load unpacked extension..." button.
4. Select the directory containing built extension: `truthsayer/archaeologist/build/`

Later on the extension could be reloaded with a button reload "⟳" in "Extensions" menu.

## Design

### Entry points

- `src/popup.ts` - pop up window for the extension.
  - This is a main user interface of the archaeologist extension.
- `src/background.ts` - main extension script, always online
  - Has access to network, can talk to smuggler.
  - Connect `popup.ts` with `content.ts`
- `src/content.ts`
  - Operates in a context of web page (every browser tab)
  - Only `context.ts` has access to a page content.

## Examples

- Initial set up https://react.christmas/2020/12

## Features to use

- Capture part of the screen https://developer.chrome.com/docs/extensions/reference/desktopCapture/
- Bookmark access https://developer.chrome.com/docs/extensions/reference/bookmarks/
- Context menu https://developer.chrome.com/docs/extensions/reference/contextMenus/
