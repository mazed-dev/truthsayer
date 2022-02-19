/**
 * Helpers to adjust styles for various devices, screen sizes and platforms
 */

import { css, SerializedStyles } from '@emotion/react'

/**
 * Enable styles given as an argument on mobile devices with touch screen only
 */
export function styleMobileTouchOnly(
  style: SerializedStyles
): SerializedStyles {
  return css`
    @media (max-width: 480px) {
      ${style};
    }
  `
}
