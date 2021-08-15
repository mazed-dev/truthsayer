import React, { useState, useCallback, useMemo, useEffect } from 'react'

import { Image } from 'react-bootstrap'

import { jcss } from '../../util/jcss'

import styles from './ImageNode.module.css'

export const ImageNode = ({ className, nid, data }) => {
  const source = data.getBlobSource(nid)
  className = jcss(styles.image, className)
  return <Image src={source} className={className} />
}
