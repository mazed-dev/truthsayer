import React from 'react'

type EmojiPropsType = {
  label?: string
  symbol?: string
  children?: string
  className?: string
}

export const Emoji = React.forwardRef<HTMLSpanElement, EmojiPropsType>(
  ({ children, className, symbol, label }: EmojiPropsType, ref) => (
    <span
      className={className}
      role="img"
      aria-label={label || ''}
      aria-hidden={label ? 'false' : 'true'}
      ref={ref}
    >
      {symbol || children}
    </span>
  )
)

export default Emoji
