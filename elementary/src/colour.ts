export enum Colour {
  White = '#fff',
  ThinGrey = 'rgb(222,222,222)',
}

export enum ColourButtonCreate {
  BorderHover = '#146c43',
  BackgroundHover = '#157347',
  Background = '#198754',
  ShadowHover = 'rgba(60,153,110,0.5)',
}

enum ColourButtonWhite {
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

export const StyleButtonCreate = {
  backgroundColor: ColourButtonCreate.Background,
  borderColor: ColourButtonCreate.Background,
  color: Colour.White,
  '&:active': {
    backgroundColor: ColourButtonCreate.BackgroundHover,
    borderColor: ColourButtonCreate.BorderHover,
  },
  '&:hover': {
    backgroundColor: ColourButtonCreate.BackgroundHover,
    borderColor: ColourButtonCreate.BorderHover,
  },
  '&:focus': {
    backgroundColor: ColourButtonCreate.BackgroundHover,
    borderColor: ColourButtonCreate.BorderHover,
    boxShadow: `0 0 0 4px ${ColourButtonCreate.ShadowHover}`,
  },
  transition: _kButtonTransition,
}

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

export const CardBorder = Colour.ThinGrey
