import React from 'react'
import ReactDOM from 'react-dom'

import { QuoteMark, QuoteHint } from './QuoteMark'

export const Main = ({path}:{
  path: string
}) => {
  return (
    <div>
      <div>akindyakov</div>
      <QuoteMark
        path={path}
      >
          <QuoteHint />
      </QuoteMark>
    </div>
  )
}

export function renderMain(mount: HTMLDivElement, path: string) {
  ReactDOM.render(<Main path={path} />, mount)
}
