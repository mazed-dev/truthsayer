import React from "react";
import { render } from "@testing-library/react";
import { TDoc, TChunk, EChunkType } from "./types";
import { makeBlankCopyOfAText } from "./chunk_util.jsx";

test("makeBlankCopyOfAText - plain text single line", () => {
  const text = "# RmdBza";
  const blank = makeBlankCopyOfAText(text);
  expect(blank).toStrictEqual(text);
});

test("makeBlankCopyOfAText - 3 items of list", () => {
  const text = "- [x] RmdBza\n- [ ] Mute\n- [x] Full";
  const blank = makeBlankCopyOfAText(text);
  expect(blank).toStrictEqual("- [ ] RmdBza\n- [ ] Mute\n- [ ] Full");
});
