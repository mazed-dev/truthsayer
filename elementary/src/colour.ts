export enum Colour {
  ButtonCreate1 = '#13653f', // Darker
  ButtonCreate2 = '#146c43',
  ButtonCreate3 = '#157347',
  ButtonCreate4 = '#198754', // Lighter
  White = '#fff',
}

export const StyleButtonCreate = {
  backgroundColor: Colour.ButtonCreate4,
  borderColor: Colour.ButtonCreate4,
  color: Colour.White,
  '&:active': {
    backgroundColor: Colour.ButtonCreate2,
    borderColor: Colour.ButtonCreate1,
  },
  '&:hover': {
    backgroundColor: Colour.ButtonCreate3,
    borderColor: Colour.ButtonCreate2,
  },
}
