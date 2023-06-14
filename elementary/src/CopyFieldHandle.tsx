/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { HoverTooltip } from './HoverTooltip'
import { ContentCopy as CopyIcon } from '@emotion-icons/material'
import type { ElementaryContext } from './context'

type Props = React.PropsWithChildren<{
  ctx: ElementaryContext
  analytics: {
    /**
     * Identifies the "subject" of the data that will be copied if user
     * clicks this button. For example, 'author' or 'title' etc.
     */
    subject: string
  }
  getTextToCopy: () => string | null
  tooltip?: string
  disabled?: boolean
}>

const Btn = styled.button`
  padding: 0.25em;

  display: inline-flex;
  align-content: center;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;

  zindex: 1;

  border-style: solid;
  border-width: 0;
  border-radius: 18px;

  background: inherit;
  opacity: 0.4;
  cursor: pointer;

  &:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.08);
  }
`

const CopyFieldHandleBox = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
  flex-direction: row;
`
const CopyFieldHandleChildren = styled.div`
  display: inline-flex;
  margin-left: 0.36em;
`
export const CopyFieldHandle = ({
  children,
  ctx,
  analytics,
  getTextToCopy,
  tooltip,
  disabled,
}: Props) => {
  const [tooltipText, setTooltipText] = React.useState<string>(
    tooltip ?? 'Copy to Clipboard'
  )
  const onClickReal = async () => {
    ctx.analytics?.capture('Button:Copy', {
      text: analytics.subject,
      'Event type': 'click',
    })
    const textToCopy = getTextToCopy()
    if (textToCopy != null) {
      await navigator.clipboard.writeText(textToCopy)
      setTooltipText('Copied')
    }
  }
  if (disabled) {
    return <>{children}</>
  }
  return (
    <CopyFieldHandleBox>
      <Btn onClick={onClickReal}>
        <HoverTooltip
          tooltip={tooltipText}
          transitionDelaySec={0.21}
          placement="bottom"
        >
          <CopyIcon size={'1em'} />
        </HoverTooltip>
      </Btn>
      <CopyFieldHandleChildren>{children}</CopyFieldHandleChildren>
    </CopyFieldHandleBox>
  )
}
