// @ts-nocheck

import React, { useState } from 'react'

import { Image, ButtonGroup, Modal } from 'react-bootstrap'

import { ImgButton } from '../../lib/ImgButton'
import { TNode } from 'smuggler-api'

import ZoomInImg from '../../img/zoom-in-strip.svg'
import ZoomOutImg from '../../img/zoom-out-strip.svg'
import ZoomResetImg from '../../img/zoom-reset-strip.svg'

import styled from '@emotion/styled'

const ImageBase = styled(Image)`
  height: auto;
  display: block;
  margin: auto;
`

const ImageInCard = styled(ImageBase)`
  max-width: 100%;

  border-style: none;
  border-radius: inherit;
`

const ImageFull = styled(ImageBase)`
  max-width: 100%;

  vertical-align: middle;
  display: inline;
`

const ButtonsUnderImage = styled.div`
  width: 100%;
  display: flex;
  align-items: right;
  justify-content: right;
  padding-right: 4px;
`

const ZoomButtonImage = styled.img`
  height: 1.5rem;
  width: 1.5rem;
  padding: 2px;
`

const ZoomImageTitle = styled(Modal.Title)`
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
`

const ImageFullModalBody = styled(Modal.Body)`
  white-space: nowrap;
  text-align: center;
`

const ImageFullHelper = styled.span`
  display: inline-block;
  height: 100%;
  vertical-align: middle;
`

export const ImageNode = ({
  className,
  node,
}: {
  className: string
  node: TNode
}) => {
  const source = node.getBlobSource()
  const [show, setShow] = useState(false)

  let imageRef
  const setImageRef = (element) => {
    imageRef = element
  }

  const handleZoomIn = () => {
    if (imageRef) {
      const newMaxWidth = imageRef.offsetWidth * 1.1
      imageRef.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomOut = () => {
    if (imageRef) {
      const newMaxWidth = imageRef.offsetWidth * 0.9091
      imageRef.style.maxWidth = `${newMaxWidth}px`
    }
  }

  const handleZoomReset = () => {
    if (imageRef) {
      imageRef.style.maxWidth = '100%'
    }
  }

  return (
    <div className={className}>
      <ImageInCard src={source} ref={setImageRef} />
      <ButtonsUnderImage>
        <ImgButton onClick={() => setShow(true)}>
          <ZoomButtonImage src={ZoomInImg} alt="Zoom image" />
        </ImgButton>
      </ButtonsUnderImage>
      <Modal show={show} fullscreen scrollable onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <ZoomImageTitle>
            <ButtonGroup>
              <ImgButton onClick={handleZoomOut}>
                <ZoomButtonImage src={ZoomOutImg} alt="Zoom out image" />
              </ImgButton>
              <ImgButton onClick={handleZoomReset}>
                <ZoomButtonImage src={ZoomResetImg} alt="Reset image zoom" />
              </ImgButton>
              <ImgButton onClick={handleZoomIn}>
                <ZoomButtonImage src={ZoomInImg} alt="Zoom in image" />
              </ImgButton>
            </ButtonGroup>
          </ZoomImageTitle>
        </Modal.Header>
        <ImageFullModalBody>
          <ImageFullHelper />
          <ImageFull src={source} ref={setImageRef} />
        </ImageFullModalBody>
      </Modal>
    </div>
  )
}
