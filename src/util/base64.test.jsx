import { toBase64, fromBase64 } from "./base64";

test("toBase64 and back fromBase64", () => {
  const inputText = "Rural tranquillity";
  expect(fromBase64(toBase64(inputText))).toStrictEqual(inputText);
});
