/** @jsxImportSource @emotion/react */

import React, { useState, useRef } from 'react'
import { Image, ButtonGroup, Modal } from 'react-bootstrap'
import styled from '@emotion/styled'

import type { TNode, StorageApi } from 'smuggler-api'
import { MdiFitScreen, MdiZoomIn, MdiZoomOut } from '../MaterialIcons'

import { ImgButton } from '../ImgButton'
import { productanalytics } from 'armoury'

const ImageBase = styled(Image)`
  height: auto;
  display: block;
  margin: auto;
`

const ImageInCard = styled(ImageBase)`
  max-width: 100%;
  border-style: none;
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
`

const ImageInCardZoom = styled(ImageInCard)`
  max-width: 100%;
  border-style: none;
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  cursor: zoom-in;
`

const ImageFull = styled(ImageBase)`
  max-width: 100%;
  vertical-align: middle;
  display: inline;
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
  node,
  className,
  strippedActions,
  storage,
}: {
  node: TNode
  className?: string
  strippedActions?: boolean
  storage: StorageApi
}) => {
  const source = storage.blob.sourceUrl(node.nid)
  if (source == null) {
    return null
  }
  if (strippedActions) {
    return <ImageInCard src={source} className={className} />
  }
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
  return (
    <>
      <ImageInCardZoom
        src={source}
        className={productanalytics.classExclude(className)}
        onClick={() => setShow(true)}
      />
      <Modal show={show} fullscreen scrollable onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <ZoomImageTitle>
            <ButtonGroup>
              <ImgButton onClick={handleZoomOut}>
                <MdiZoomOut
                  css={{ fontSize: '24px', verticalAlign: 'middle' }}
                />
              </ImgButton>
              <ImgButton onClick={handleZoomReset}>
                <MdiFitScreen
                  css={{ fontSize: '24px', verticalAlign: 'middle' }}
                />
              </ImgButton>
              <ImgButton onClick={handleZoomIn}>
                <MdiZoomIn
                  css={{ fontSize: '24px', verticalAlign: 'middle' }}
                />
              </ImgButton>
            </ButtonGroup>
          </ZoomImageTitle>
        </Modal.Header>
        <ImageFullModalBody>
          <ImageFullHelper />
          <ImageFull
            src={source}
            className={productanalytics.classExclude()}
            ref={imageRef}
          />
        </ImageFullModalBody>
      </Modal>
    </>
  )
}
