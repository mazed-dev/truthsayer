import keycode from "keycode";

const UserAgent = require("fbjs/lib/UserAgent");

const isOSX = UserAgent.isPlatform('Mac OS X');

export const Keys: Map<string, number> = {
  A: 65,
  ALT: 18,
  BACKSPACE: 8,
  COMMA: 188,
  DELETE: 46,
  DOWN: keycode("down"),
  END: 35,
  ENTER: keycode("enter"),
  ESC: 27,
  HOME: 36,
  LEFT: 37,
  NUMPAD_0: 96,
  NUMPAD_9: 105,
  PAGE_DOWN: 34,
  PAGE_UP: 33,
  PERIOD: 190,
  RETURN: 13,
  RIGHT: 39,
  SPACE: 32,
  TAB: keycode("tab"),
  UP: keycode("up"),
  Z: 90,
  ZERO: 48,

  a: keycode("a"),
  z: keycode("z"),
  v: keycode("v"),
};

export function isSymbol(keycode: number): bool {
  return (keycode > 47 && keycode < 58)   || // number keys
    (keycode > 64 && keycode < 91)   || // letter keys
    (keycode > 95 && keycode < 112)  || // numpad keys
    (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
    (keycode > 218 && keycode < 223);   // [\]' (in order)
}

export function isHotkeyCopy(event: Any): bool {
  // Not quite sure about OSX
  return event.ctrlKey && event.which === Keys.v;
}
