/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { Close } from '@emotion-icons/material'
import { ContentContext } from '../context'

import { ImgButton } from 'elementary'
import { SuggestedCardBox } from './SuggestedCard'

import { ContentAugmentationProductUpdate } from './../../message/types'

const kSignatureOfProductUpdateToShow = 'foreward-rebranding-03-06-2023'

const Box = styled(SuggestedCardBox)`
  background-image: linear-gradient(90deg, #e9f2fb, #f9fdfe);
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
  margin: 0 12px 0 0;
  font-size: 12px;
  vertical-align: middle;
  background: unset;
  border-radius: 12px;
`
const HeaderHref = styled.a`
  font-size: 1.2em;
  font-weight: 400;
  margin: 0 0 0 12px;
  text-decoration: none;
  color: inherit;
  &:hover {
    box-shadow: inset 0 -1px 0 0 #000000;
  }
`
const ProductUpdateMiniCardBox = styled(Header)`
  justify-content: space-between;
  align-content: center;
  align-items: center;
  padding: 8px 0 8px 0;
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
      'Event type': 'click',
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
          ctx.analytics?.capture('Click product update link', {
            'Event type': 'click',
            productUpdateSignature: kSignatureOfProductUpdateToShow,
          })
        }}
      >
        <HeaderHref
          href="https://thinkforeword.com/foreword-release-notes"
          target="_blank"
          rel="noopener noreferrer"
        >
          Product update and re-brand to <i>Foreword</i>
        </HeaderHref>
        <HeaderBtn onClick={closeProductUpdate}>
          <Close size="14px" />
        </HeaderBtn>
      </ProductUpdateMiniCardBox>
    </Box>
  )
}
