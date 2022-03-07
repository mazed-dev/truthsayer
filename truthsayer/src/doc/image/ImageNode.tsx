/** @jsxImportSource @emotion/react */

import React, { useState, useRef } from 'react'

import { Image, ButtonGroup, Modal } from 'react-bootstrap'

import { ImgButton } from '../../lib/ImgButton'
import { TNode } from 'smuggler-api'

import { jcss } from 'elementary'

import ZoomInImg from '../../img/zoom-in-strip.svg'
import ZoomOutImg from '../../img/zoom-out-strip.svg'
import ZoomResetImg from '../../img/zoom-reset-strip.svg'

import styles from './ImageNode.module.css'

export const ImageNode = ({
  className,
  node,
}: {
  className: string
  node: TNode
}) => {
  const source = node.getBlobSource()
  const [show, setShow] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)
  const handleZoomIn = () => {
    const current = imageRef?.current
    if (current != null) {
      const newMaxWidth = current.offsetWidth * 1.1
      current.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomOut = () => {
    const current = imageRef?.current
    if (current != null) {
      const newMaxWidth = current.offsetWidth * 0.9091
      current.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomReset = () => {
    const current = imageRef?.current
    if (current != null) {
      current.style.maxWidth = '100%'
    }
  }

  if (source == null) {
    return null
  }
  return (
    <div className={className}>
      <Image
        src={source}
        className={jcss(styles.image, styles.image_in_card)}
        onClick={() => setShow(true)}
      />
      <Modal show={show} fullscreen scrollable onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title className={styles.zoom_image_title}>
            <ButtonGroup className={styles.zoom_button_group}>
              <ImgButton onClick={handleZoomOut}>
                <img
                  src={ZoomOutImg}
                  className={styles.zoom_button_image}
                  alt="Zoom out image"
                />
              </ImgButton>
              <ImgButton onClick={handleZoomReset}>
                <img
                  src={ZoomResetImg}
                  className={styles.zoom_button_image}
                  alt="Reset image zoom"
                />
              </ImgButton>
              <ImgButton onClick={handleZoomIn}>
                <img
                  src={ZoomInImg}
                  className={styles.zoom_button_image}
                  alt="Zoom in image"
                />
              </ImgButton>
            </ButtonGroup>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.image_full_modal_body}>
          <span className={styles.image_full_helper} />
          <Image
            src={source}
            className={jcss(styles.image, styles.image_full)}
            ref={imageRef}
          />
        </Modal.Body>
      </Modal>
    </div>
  )
}
