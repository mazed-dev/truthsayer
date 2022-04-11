import React from 'react'
import ReactDOM from 'react-dom'

import { PopUpApp } from './popup/PopUpApp'
import './popup.css'

const mountNode = document.getElementById('popup')
ReactDOM.render(<PopUpApp />, mountNode)
