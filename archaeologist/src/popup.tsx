import React from 'react'
import ReactDOM from 'react-dom'

import { App } from './components/App'
import './popup.css'

const mountNode = document.getElementById('popup')
ReactDOM.render(<App />, mountNode)
