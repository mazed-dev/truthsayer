export enum Colour {
  White = '#fff',
}

export enum ColourButtonCreate {
  BorderHover = '#146c43',
  BackgroundHover = '#157347',
  Background = '#198754',
  ShadowHover = 'rgba(60,153,110,0.5)',
}

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
  transition: `color .15s ease-in-out,
               background-color .15s ease-in-out,
               border-color .15s ease-in-out,
               box-shadow .15s ease-in-out`,
}
