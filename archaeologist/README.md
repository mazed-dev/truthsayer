# Mazed browser extension

## Dev

To (re)build `archaeologist` you need to build dependencies first:

1. `yarn smuggler-api build`
2. `yarn elementary build`

Building and uploading extension process differs for different browsers, therefore there are different build commands and other instructions for each.


### Local dev environment

Local dev environment here and further is referenced as just "local" (build/set-up/etc).

Local build of the extension talks to the local instance of `truthsayer` (`http://localhost:3000/`), so to make local build of the extension work you need to spin up both `smuggler` and `truthsayer` beforehand.

To build and run local version of archaeologist for **Chrome** run:
```
% yarn archaeologist run:chrome:local
```
for public version (which uses prod smuggler) run:
```
% yarn archaeologist run:chrome:public
```

To build and run local version of archaeologist for **Firefox** run:
```
% yarn archaeologist run:firefox:local
```
for public version (which uses prod smuggler) run:
```
% yarn archaeologist run:firefox:public
```

### How to publish

- For Chrome web store see [`pack/chrome/readme.md`](./pack/chrome/readme.md).
- For Mozilla web store see [`pack/firefox/readme.md`](./pack/firefox/readme.md).

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
