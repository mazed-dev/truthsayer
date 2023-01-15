import '@emotion/react'

declare module '@emotion/react' {
  export interface ThemeColor {
    primary: string
    positive: string
    negative: string
  }

  export interface Theme {
    color: ThemeColor
    backgroundColor: ThemeColor
    image: {
      filter?: string
    }
  }
}
