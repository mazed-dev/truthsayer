import { TChunk, TDraftDoc, TContentBlock } from "./../doc/types.jsx";

var unified = require("unified");
var markdown = require("remark-parse");
// var remark2rehype = require('remark-rehype')
// var doc = require('rehype-document')
// var format = require('rehype-format')
// var html = require('rehype-stringify')
// var report = require('vfile-reporter')

function generateRandomKey(): string {
  return Math.random().toString(32).substring(2);
}

const kBlockTypeH1 = "header-one";
const kBlockTypeH2 = "header-two";
const kBlockTypeH3 = "header-three";
const kBlockTypeH4 = "header-four";
const kBlockTypeH5 = "header-five";
const kBlockTypeH6 = "header-six";
const kBlockTypeQuote = "blockquote";
const kBlockTypeCode = "code-block";
const kBlockTypeAtomic = "atomic";
const kBlockTypeUnorderedItem = "unordered-list-item";
const kBlockTypeOrderedItem = "ordered-list-item";
const kBlockTypeUnstyled = "unstyled";

const kBlockTypeUnorderedCheckItem = "unordered-check-item";

export function mdToDraftDoc(chunks: TChunk[]): TDraftDoc {
  const root = unified().use(markdown).parse(md);
  root.children.forEach((v) => {
    console.log(JSON.stringify(v));
  });
}

export function mdToBlocks(source: string): TContentBlock[] {
  const root = unified().use(markdown).parse(source);
  let blocks: TContentBlock[] = [];
  root.children.forEach((v) => {
    console.log(JSON.stringify(v));
    blocks = mdToBlocksRec(blocks, v);
  });
}

function getHeaderType(depth: number): string {
  switch (depth) {
    case 0:
      return kBlockTypeH1;
    case 1:
      return kBlockTypeH2;
    case 2:
      return kBlockTypeH3;
    case 3:
      return kBlockTypeH4;
    case 4:
      return kBlockTypeH5;
    default:
      return kBlockTypeH6;
  }
}

function makeHeaderBlock(text: string, depth: number): TContentBlock {
  return {
    key: generateRandomKey(),
    text: text,
    type: getHeaderType(depth),
    characterList: null,
    depth: 0,
    data: {},
  };
}

function makeListItemBlock(
  text: string,
  depth: number,
  ordered: boolean
): TContentBlock {
  return {
    key: generateRandomKey(),
    text: text,
    type: ordered ? kBlockTypeOrderedItem : kBlockTypeUnorderedItem,
    characterList: null,
    depth: depth,
    data: {},
  };
}

/**
 * "children":[
 *    {
 *      "type":"listItem",
 *      "loose":false,
 *      "checked":null,
 *      "children":[
 *        {
 *          "type":"paragraph",
 *          "children":[
 *            {
 *              "type":"link",
 *              "title":null,
 *              "url":"wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg",
 *              "children":[
 *                {
 *                  "type": "text",
 *                  "value":"Travel history",
 */

function makeListBlocks(
  blocks: TContentBlock[],
  ordered: boolean,
  depth: number,
  children: any[]
): TContentBlock[] {
  return blocks; // .concat(children.map((v) => {}));
}

function mdToBlocksRec(blocks: TContentBlock[], mdBlock: any): TContentBlock[] {
  if (mdBlock.type === "heading") {
    blocks.push(makeHeaderBlock(mdBlock.type, mdBlock.depth || 0));
  } else if (mdBlock.type === "list") {
    blocks = makeListBlocks(blocks, mdBlock.ordered || false, mdBlock.depth || 0, mdBlock.children || []);
  } else if (mdBlock.type === "paragraph") {
  } else if (mdBlock.type === "code") {
  } else if (mdBlock.type === "table") {
  } else if (mdBlock.type === "blockquote") {
  } else if (mdBlock.type === "thematicBreak") {
  }
  return blocks;
}
