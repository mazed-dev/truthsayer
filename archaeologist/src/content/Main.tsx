import React from 'react'
import ReactDOM from 'react-dom'

import { QuoteMark, QuoteHint } from './QuoteMark'

export const Main = () => {
  return (
    <div>
      <div>akindyakov</div>
      <QuoteMark
        path={
          'html body div#content div#bodyContent div#mw-content-text div:nth-of-type(1) table#mp-upper tbody tr td#mp-right div#mp-itn ul li:nth-of-type(2)'
        }
      >
          <QuoteHint />
      </QuoteMark>
    </div>
  )
}

export function renderMain(rootEl: HTMLDivElement) {
  ReactDOM.render(<Main />, rootEl)
}
