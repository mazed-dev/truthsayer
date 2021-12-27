# Mazed browser extension

## Dev

To (re)build `archaeologist` you need to build dependencies first:

1. `yarn smuggler-api build`
2. `yarn elementary build`

Building and uploading extension process differs for different browsers, therefore there are different build commands and instructions for ever one of them.

Local dev version talks to local instance of mazed (`http://localhost:3000/`), so to play with it locally you need to spin up both `smuggler` and `truthsayer` beforehand.

### Chrome: local

To build local dev version run:

```sh
yarn archaeologist build:chrome:local
```

The result will be in `truthsayer/archaeologist/target/unpacked/`.

Extension can be imported from a file to Chrome or Chromium in dev mode:

1. Visit [chrome://extensions](chrome://extensions) (via [`omnibox`](https://developer.chrome.com/docs/extensions/reference/omnibox/) or "menu" -> "Tools" -> "Extensions").
2. Enable "Developer mode" by ticking the checkbox in the top right corner.
3. Click on the "Load unpacked extension..." button.
4. Select the directory containing built extension: `truthsayer/archaeologist/target/unpacked/`

Later on the extension could be reloaded with a button reload "⟳" in "Extensions" menu.

### Chrome: public

To build public version that talks to `https://mazed.dev` run:

```sh
yarn archaeologist build:chrome:public
```

After that repeat steps from importing dev version to your browser.

### Chrome Web Store

An instructions on how to publish fresh version of Mazed Chrome extension are in [`pack/chrome/readme.md`](./pack/chrome/readme.md).

## Design

[See google chrome extension development documentation for more details](https://developer.chrome.com/docs/extensions/mv3/getstarted/).

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
