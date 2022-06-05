import browser from 'webextension-polyfill'

const inputEnteredListener = (
  text: string,
  disposition: browser.Omnibox.OnInputEnteredDisposition
) => {
  console.log('Mazed omnibox inputEnteredListener', text, disposition)
}

const inputChangedListener = (
  text: string,
  suggest: (suggestResults: browser.Omnibox.SuggestResult[]) => void
) => {
  console.log('Mazed omnibox inputChangedListener', text, suggest)
  browser.omnibox.setDefaultSuggestion({
    description: `Search <match>${text}</match> in timeline`,
  })
  suggest([
    {
      content: 'Bookmark: https://stackoverflow.com/a/1091953/89484',
      description: `Description 1 ☀️  <match>${text}</match>  <dim>${text}</dim> <url href="df">https://stackoverflow.com/a/1091953/89484</url>`,
    },
    {
      content: 'Quote: asdf' + text,
      description: 'Description 2 ⛅️ ' + text,
    },
    {
      content: `Mail: from Alex`,
      description: `See <match>${text}</match>in Mazed app`,
    },
  ])
}

const inputStartedListener = () => {
  console.log('Mazed omnibox inputStartedListener')
}

const inputCancelledListener = () => {
  console.log('Mazed omnibox inputCancelledListener')
}

export function register() {
  if (!browser.omnibox.onInputEntered.hasListener(inputEnteredListener)) {
    browser.omnibox.onInputEntered.addListener(inputEnteredListener)
  }
  if (!browser.omnibox.onInputChanged.hasListener(inputChangedListener)) {
    browser.omnibox.onInputChanged.addListener(inputChangedListener)
  }
  if (!browser.omnibox.onInputStarted.hasListener(inputStartedListener)) {
    browser.omnibox.onInputStarted.addListener(inputStartedListener)
  }
  if (!browser.omnibox.onInputCancelled.hasListener(inputCancelledListener)) {
    browser.omnibox.onInputCancelled.addListener(inputCancelledListener)
  }
  return () => {
    browser.omnibox.onInputEntered.removeListener(inputEnteredListener)
    browser.omnibox.onInputChanged.removeListener(inputChangedListener)
    browser.omnibox.onInputStarted.removeListener(inputStartedListener)
    browser.omnibox.onInputCancelled.removeListener(inputCancelledListener)
  }
}
