import { TChunk, TDraftDoc, TContentBlock } from "./../doc/types.jsx";

import { markdownToDraft, draftToMarkdown } from "markdown-draft-js";

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

const kBlockTypeHr = "hr";

const kBlockTypeUnorderedCheckItem = "unordered-check-item";

function mdImageItemToBlock(item) {
  return {
    type: "atomic",
    mutability: "IMMUTABLE",
    data: {
      src: item.src,
      alt: item.alt,
    },
  };
}

function mdLinkToBlock(item) {
  console.log("mdLinkToBlock", item);
  // TODO(akindyakov) Parse your custom dates here
  return {
    type: "LINK",
    mutability: "MUTABLE",
    data: {
      url: item.href,
      href: item.href,
    },
  };
}

function mdTableToBlock(item) {
  console.log("mdTableToBlock", item);
  return {
    type: kBlockTypeHr,
  };
}

function mdHrToBlock(item) {
  console.log("mdHrToBlock", item);
  return {
    type: kBlockTypeHr,
  };
}

// TODO(akindyakov) Why tabe is not parsed?
export function markdownToDoc(source: string): TDraftDoc {
  var rawObject = markdownToDraft(source, {
    blockEntities: {
      image: mdImageItemToBlock,
      link_open: mdLinkToBlock,

      // table_open: mdTableToBlock,
      // inline: mdTableToBlock,
      // table_close: mdTableToBlock,
      // table_open: mdTableToBlock,
      // tbody_close: mdTableToBlock,
      // tbody_open: mdTableToBlock,
      // td_close: mdTableToBlock,
      // th_close: mdTableToBlock,
      // th_open: mdTableToBlock,
      // thead_close: mdTableToBlock,
      // thead_open: mdTableToBlock,
      // tr_close: mdTableToBlock,
      // tr_open: mdTableToBlock,
    },
    blockTypes: {
      hr: mdHrToBlock,
      table_open: mdTableToBlock,

      inline: mdTableToBlock,
      table_close: mdTableToBlock,
      tbody_close: mdTableToBlock,
      tbody_open: mdTableToBlock,
      // td_close: mdTableToBlock,
      // th_close: mdTableToBlock,
      th_open: mdTableToBlock,
      // thead_close: mdTableToBlock,
      // TODO(akindyakov) There is a but in thirdpart library
      // tr_open: mdTableToBlock,
      thead_open: mdTableToBlock,
      // tr_close: mdTableToBlock,
    },
    // remarkablePlugins: [],
    remarkablePreset: "full",
    remarkableOptions: {
      disable: {},
      enable: {
        block: ['table'],
      },
    },
  });
  console.log("Raw object", rawObject);
}

export function docToMarkdown(doc: TDraftDoc): string {
  var markdownString = draftToMarkdown(rawObject);
}

// export function mdToDraftDoc(chunks: TChunk[]): TDraftDoc {
//   const root = unified().use(markdown).parse(md);
//   root.children.forEach((v) => {
//     console.log(JSON.stringify(v));
//   });
// }
//
// export function markdownToBlocks(source: string): TContentBlock[] {
//   const root = unified().use(markdown).parse(source);
//   let blocks: TContentBlock[] = [];
//   root.children.forEach((v) => {
//     console.log(JSON.stringify(v));
//     blocks = mdToBlocksRec(blocks, v);
//   });
// }
//
// function getHeaderType(depth: number): string {
//   switch (depth) {
//     case 0:
//       return kBlockTypeH1;
//     case 1:
//       return kBlockTypeH2;
//     case 2:
//       return kBlockTypeH3;
//     case 3:
//       return kBlockTypeH4;
//     case 4:
//       return kBlockTypeH5;
//     default:
//       return kBlockTypeH6;
//   }
// }
//
// function makeHeaderBlock(text: string, depth: number): TContentBlock {
//   return {
//     key: generateRandomKey(),
//     text: text,
//     type: getHeaderType(depth),
//     characterList: null,
//     depth: 0,
//     data: {},
//   };
// }
//
// function makeListItemBlock(
//   text: string,
//   depth: number,
//   ordered: boolean
// ): TContentBlock {
//   return {
//     key: generateRandomKey(),
//     text: text,
//     type: ordered ? kBlockTypeOrderedItem : kBlockTypeUnorderedItem,
//     characterList: null,
//     depth: depth,
//     data: {},
//   };
// }

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
    blocks = makeListBlocks(
      blocks,
      mdBlock.ordered || false,
      mdBlock.depth || 0,
      mdBlock.children || []
    );
  } else if (mdBlock.type === "paragraph") {
  } else if (mdBlock.type === "code") {
  } else if (mdBlock.type === "table") {
  } else if (mdBlock.type === "blockquote") {
  } else if (mdBlock.type === "thematicBreak") {
  }
  return blocks;
}

const convertHtmlToEditorState = (newHtml) => {
  // html conversion normally ignores <hr> tags, but using this character substitution it can be configured to preserve them.
  const inputHtml = (
    newHtml ??
    props.value ??
    props.fl?.getValue(props.name) ??
    ""
  ).replace(/<hr\/?>/g, "<div>---hr---</div>");

  /**
   * Special parsing for legacy Instascreen data and content pasted in from other sources (google docs, summernote, etc.)
   *
   * This code:
   * 1. removes <style> tags which are sometime present from pasted word content.
   * 2. Some content created in summernote or otherwise has text that's not wrapped in any html
   * tag mixed with other content that is in tags. In the draft-js richEditor all the unwrapped
   * text gets lumped together in one div at the start of the document. This code goes through and wraps
   * those text nodes in <div> tags separately and in order with the rest of the content.
   * 3. Finds tags that contain style white-space: pre-wrap and substitutes non-breaking space characters
   * for spaces and <br> tags for newline characters so they get preserved when converted to draft.js state.
   * 4. Finds block-level tags (div, p) inside <li> list items and <td> table cells and converts them to inline <span> elements,
   * otherwise the div & p tags would take precedence and the list or table structure gets lost in the conversion.
   */
  const blockTags = [
    "div",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "table",
    "ol",
    "ul",
    "hr",
    "pre",
    "section",
    "header",
    "nav",
    "main",
    "blockquote",
  ];
  const domParser = new DOMParser();
  const tempDoc = domParser.parseFromString(inputHtml, "text/html");
  const parsedHTML = tempDoc.querySelector("body");
  let child = parsedHTML.firstChild;
  if (parsedHTML.children.length === 1 && child.tagName === "TABLE") {
    child = document.createElement("br");
    parsedHTML.insertBefore(child, parsedHTML.firstChild);
    parsedHTML.appendChild(document.createElement("br"));
  }
  while (child) {
    // remove Style tags
    if (child.tagName === "STYLE") {
      const nextChild = child.nextSibling;
      parsedHTML.removeChild(child);
      child = nextChild;
      continue;
    }
    // handle text content that is not within block elements
    if (!blockTags.includes(child.tagName?.toLowerCase())) {
      const wrapper = tempDoc.createElement("div");
      let nextChild = child.nextSibling;
      wrapper.appendChild(child);
      while (
        nextChild &&
        !blockTags.includes(nextChild.tagName?.toLowerCase())
      ) {
        const currentChild = nextChild;
        nextChild = currentChild.nextSibling;
        wrapper.appendChild(currentChild);
      }
      parsedHTML.insertBefore(wrapper, nextChild);
      child = nextChild;
    }

    child = child?.nextSibling;
  }

  // recursive function to walk the full DOM tree, making modifications as needed
  // to preserve formatting during conversion to internal state for draft.js
  const traverse = (node, isNestedBlock) => {
    if (!node) return;
    // elements formatted with spacing and soft line-breaks
    if (/white-space:\s*(pre|pre-wrap);?/.test(node.getAttribute("style"))) {
      node.innerHTML = node.innerHTML
        .replace(/\n/g, "<br>")
        .replace(/\s{2}/g, "&nbsp;&nbsp;")
        .replace(/&nbsp;\s/g, "&nbsp;&nbsp;");
      let style = node.getAttribute("style");
      style = style.replace(/white-space:\s*(pre|pre-wrap);?/, "");
      node.setAttribute("style", style);
    }
    // replace block elements inside lists with inline <span> elements
    if (isNestedBlock && ["DIV", "P", "INPUT"].includes(node.tagName)) {
      const newNode = changeTag(node, "span");
      node.replaceWith(newNode);
      node = newNode;
    }
    // If a nested table has a single row and cell, switch it to a span as a single cell's contents of the outer table
    if (isNestedBlock && node.tagName === "TABLE") {
      if (node.firstElementChild.tagName === "TBODY") {
        const numRows = node.firstElementChild.children.length;
        if (numRows === 1) {
          const numCells =
            node.firstElementChild.firstElementChild.children.length;
          if (numCells === 1) {
            let cell =
              node.firstElementChild.firstElementChild.firstElementChild;
            if (["DVI", "P"].includes(cell.firstElementChild.tagName)) {
              cell = cell.firstElementChild;
            }
            const newNode = changeTag(cell, "span");
            node.replaceWith(newNode);
          }
        }
      }
    }
    traverse(node.nextElementSibling, isNestedBlock);
    isNestedBlock =
      isNestedBlock ||
      node.tagName === "LI" ||
      node.tagName === "TD" ||
      node.tagName === "TH";
    traverse(node.firstElementChild, isNestedBlock);
  };

  traverse(parsedHTML.firstElementChild);

  // function used within traverse() for converting block elements to inline span elements
  function changeTag(element, tag) {
    // prepare the elements
    const newElem = document.createElement(tag);
    const clone = element.cloneNode(true);
    // move the children from the clone to the new element
    while (clone.firstChild) {
      newElem.appendChild(clone.firstChild);
    }
    // copy the attributes
    for (const attr of clone.attributes) {
      if (attr.name === "value") {
        newElem.textContent = attr.value;
      } else {
        newElem.setAttribute(attr.name, attr.value);
      }
    }
    return newElem;
  }

  const s = new XMLSerializer();
  const newContent = s.serializeToString(parsedHTML);
  // end special parsing

  let newEditorState = EditorState.createWithContent(
    stateFromHTML(newContent, stateFromHtmlOptions)
  );
  newEditorState = EditorState.moveSelectionToEnd(newEditorState);
  return supplementalCustomBlockStyleFn(newEditorState);
};
