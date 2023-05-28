/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { Close } from '@emotion-icons/material'
import { ContentContext } from '../context'

import { ImgButton } from 'elementary'
import { SuggestedCardBox } from './SuggestedCard'

import { ContentAugmentationProductUpdate } from './../../message/types'

const kSignatureOfProductUpdateToShow = 'foreward-rebranding-28-05-2023'

const Box = styled(SuggestedCardBox)`
  background-image: linear-gradient(#c0defc, #005be3);
  transition: height 500ms;
  padding: 0;
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
const HeaderTitle = styled.h2`
  font-size: 1.2em;
  font-weight: 400;
  margin: 0 0 0 1em;
`
const Message = styled.div``
const MessageLink = styled.a``

const ProductUpdateMiniCardBox = styled(Header)`
  justify-content: space-between;
  align-content: center;
  align-items: center;
  padding: 5px;
  &:hover {
    cursor: pointer;
  }
`

export const ProductUpdateCard = ({
  productUpdateConfig,
  updateProductUpdateConfig,
}: {
  productUpdateConfig?: ContentAugmentationProductUpdate
  updateProductUpdateConfig: (
    update: ContentAugmentationProductUpdate | undefined
  ) => Promise<void>
}) => {
  const ctx = React.useContext(ContentContext)
  React.useEffect(() => {
    if (
      productUpdateConfig?.signature != null &&
      kSignatureOfProductUpdateToShow == null
    ) {
      // Clean up
      updateProductUpdateConfig(undefined)
    }
  }, [productUpdateConfig?.signature, updateProductUpdateConfig])
  const [isClosed, setClosed] = React.useState<boolean>(
    productUpdateConfig?.signature === kSignatureOfProductUpdateToShow
  )
  const [isMiminised, setMiminised] = React.useState<boolean>(true)
  const closeProductUpdate = React.useCallback(() => {
    updateProductUpdateConfig({
      signature: kSignatureOfProductUpdateToShow,
    }).then(() => {
      setClosed(true)
    })
    // To measure how many people saw the update and closed it.
    ctx.analytics?.capture('Click product update close', {
      'Event type': 'change',
      isRevealed: !isMiminised,
      productUpdateSignature: kSignatureOfProductUpdateToShow,
    })
  }, [updateProductUpdateConfig, setClosed, ctx.analytics, isMiminised])
  if (isClosed) {
    return null
  }
  return (
    <Box>
      <ProductUpdateMiniCardBox
        onClick={() => {
          setMiminised((value) => !value)
          // To measure how many people opened product update
          ctx.analytics?.capture('Click product update visibility toggle', {
            'Event type': 'change',
            productUpdateSignature: kSignatureOfProductUpdateToShow,
          })
        }}
      >
        <HeaderTitle>Meet Foreword 🎉 </HeaderTitle>
        <HeaderBtn onClick={closeProductUpdate}>
          <Close size="14px" />
        </HeaderBtn>
      </ProductUpdateMiniCardBox>
      <BodyBox css={{ display: isMiminised ? 'none' : 'block' }}>
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
