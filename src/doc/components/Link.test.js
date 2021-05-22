import React from "react";
import { render } from "@testing-library/react";
import { insertPiece, deleteSelected, backspaceSelected } from "./Link.js";

test("insertPiece - simple", () => {
  expect(insertPiece("-", "abcd", 0, 0)).toStrictEqual("-abcd");
  expect(insertPiece("-", "abcd", 1, 1)).toStrictEqual("a-bcd");

  expect(insertPiece("-", "abcd", 1, 2)).toStrictEqual("a-cd");
  expect(insertPiece("-", "abcd", 0, 1)).toStrictEqual("-bcd");
});

test("deleteSelected", () => {
  expect(deleteSelected("abcd", 1, 1)).toStrictEqual("acd");
  expect(deleteSelected("abcd", 1, 2)).toStrictEqual("acd");
  expect(deleteSelected("abcd", 0, 2)).toStrictEqual("cd");

  expect(deleteSelected("abcd", 0, 0)).toStrictEqual("bcd");
  expect(deleteSelected("abcd", 4, 4)).toStrictEqual("abcd");
});

test("backspaceSelected", () => {
  expect(backspaceSelected("abcd", 1, 1)).toStrictEqual("bcd");
  expect(backspaceSelected("abcd", 0, 2)).toStrictEqual("cd");
  expect(backspaceSelected("abcd", 0, 2)).toStrictEqual("cd");

  expect(backspaceSelected("abcd", 0, 0)).toStrictEqual("abcd");
});
