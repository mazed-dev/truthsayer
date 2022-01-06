export enum Colour {
  ButtonCreateBorderHover = '#146c43',
  ButtonCreateBackgroundHover = '#157347',
  ButtonCreateBackground = '#198754',
  ButtonCreateShadowHover = 'rgba(60,153,110,0.5)',
  White = '#fff',
}

export const StyleButtonCreate = {
  backgroundColor: Colour.ButtonCreateBackground,
  borderColor: Colour.ButtonCreateBackground,
  color: Colour.White,
  '&:active': {
    backgroundColor: Colour.ButtonCreateBackgroundHover,
    borderColor: Colour.ButtonCreateBorderHover,
  },
  '&:hover': {
    backgroundColor: Colour.ButtonCreateBackgroundHover,
    borderColor: Colour.ButtonCreateBorderHover,
  },
  '&:focus': {
    backgroundColor: Colour.ButtonCreateBackgroundHover,
    borderColor: Colour.ButtonCreateBorderHover,
    boxShadow: `0 0 0 4px ${Colour.ButtonCreateShadowHover}`,
  },
  transition: `color .15s ease-in-out,
               background-color .15s ease-in-out,
               border-color .15s ease-in-out,
               box-shadow .15s ease-in-out`,
}
