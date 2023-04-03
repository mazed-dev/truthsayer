export enum Colour {
  White = '#fff',
  ThinGrey = '#e3e3e3',
}

export enum ColourButtonWhite {
  Foreground = 'rgba(38,38,38,0.5) !important',
  Background = '#ffffff !important',
  BackgroundHover = '#d0d1d2 !important',
  ForegroundHover = 'rgba(38,38,38,1) !important',
  ShadowHover = 'rgba(0, 0, 0, 0.125) !important',
  BorderHover = 'rgba(0, 0, 0, 0.225) !important',
}

const _kButtonTransition = `color .15s ease-in-out,
               background-color .15s ease-in-out,
               border-color .15s ease-in-out,
               box-shadow .15s ease-in-out`

export const StyleButtonCreate = `
  color: #ffffff;
  border: 1px solid #ececec;
  background-image: linear-gradient(#54a3ff, #006eed);
  &:active &:hover &:focus {
    background-color: none;
    border-color: #ececec;
  }
  &:hover {
    cursor: pointer;
  }
  transition: ${_kButtonTransition};
`

export const StyleButtonWhite = {
  backgroundColor: ColourButtonWhite.Background,
  color: ColourButtonWhite.Foreground,
  borderColor: ColourButtonWhite.Background,
  boxShadow: 'none',
  '&:active': {
    backgroundColor: ColourButtonWhite.BackgroundHover,
    borderColor: ColourButtonWhite.BorderHover,
    boxShadow: `0 0 0 2px ${ColourButtonWhite.ShadowHover}`,
    color: ColourButtonWhite.ForegroundHover,
  },
  '&:hover': {
    backgroundColor: ColourButtonWhite.BackgroundHover,
    borderColor: ColourButtonWhite.BorderHover,
    color: ColourButtonWhite.ForegroundHover,
  },
  '&:focus': {
    backgroundColor: ColourButtonWhite.BackgroundHover,
    borderColor: ColourButtonWhite.BorderHover,
    boxShadow: `0 0 0 2px ${ColourButtonWhite.ShadowHover}`,
    color: ColourButtonWhite.ForegroundHover,
  },
  transition: _kButtonTransition,
}

export const kCardBorderColour = Colour.ThinGrey
export const kCardBorder = `border: 1px solid ${Colour.ThinGrey}`
