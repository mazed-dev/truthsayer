import React from 'react'

import './components.css'

import { joinClasses } from '../../../util/elClass.js'

export const HRule = ({ contentState, block, className }) => {
  return <hr className={joinClasses(className, 'doc_block_hrule')} />
}
