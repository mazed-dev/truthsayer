/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { Close } from '@emotion-icons/material'

import { ImgButton } from 'elementary'
import { log } from 'armoury'
import { SuggestedCardBox } from './SuggestedCard'

import { ContentAugmentationProductUpdate } from './../../message/types'

const kSignatureOfProductUpdateToShow = 'foreward-rebranding-26-05-2023'

const Box = styled(SuggestedCardBox)`
  background-image: linear-gradient(#e9f2fb, #1b7ff4);
`

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  flex-wrap: nowrap;
  padding: 2px 0 2px 0;
`
const HeaderBtn = styled(ImgButton)`
  padding: 3px;
  margin: 1px 5px 0 5px;
  font-size: 12px;
  vertical-align: middle;
  background: unset;
  border-radius: 12px;
`
const BodyBox = styled.div`
  padding: 0 8px 8px 8px;
`
const Title = styled.h2`
  font-size: 1.2em;
  margin: 0 0 1em 0;
`
const Message = styled.div``
const MessageLink = styled.a``

export const ProductUpdateCard = ({
  productUpdateConfig,
  updateProductUpdateConfig,
}: {
  productUpdateConfig?: ContentAugmentationProductUpdate
  updateProductUpdateConfig: (
    update: ContentAugmentationProductUpdate | undefined
  ) => Promise<void>
}) => {
  log.debug('Render ProductUpdateCard ', productUpdateConfig)
  React.useEffect(() => {
    if (
      productUpdateConfig?.signature != null &&
      kSignatureOfProductUpdateToShow == null
    ) {
      // Clean up
      updateProductUpdateConfig(undefined)
    }
  }, [productUpdateConfig?.signature, updateProductUpdateConfig])
  const [isHidden, hide] = React.useState<boolean>(
    productUpdateConfig?.signature === kSignatureOfProductUpdateToShow
  )
  // if (productUpdateConfig?.signature === kSignatureOfProductUpdateToShow) {
  if (isHidden) {
    return null
  }
  log.debug('Render ProductUpdateCard')
  return (
    <Box>
      <Header>
        <HeaderBtn
          onClick={() => {
            updateProductUpdateConfig({
              signature: kSignatureOfProductUpdateToShow,
            }).then(() => {
              hide(true)
            })
          }}
        >
          <Close size="14px" />
        </HeaderBtn>
      </Header>
      <BodyBox>
        <Title>Meet Foreword!</Title>
        <Message>
          Here will be an outstanding text about rebrading with{' '}
          <MessageLink href="https://thinkforeword.com">
            link to a release notes page
          </MessageLink>
          .
        </Message>
      </BodyBox>
    </Box>
  )
}
