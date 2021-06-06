import {
  kBlockTypeAtomic,
  kBlockTypeCode,
  kBlockTypeH1,
  kBlockTypeH2,
  kBlockTypeH3,
  kBlockTypeH4,
  kBlockTypeH5,
  kBlockTypeH6,
  kBlockTypeHrule,
  kBlockTypeOrderedItem,
  kBlockTypeQuote,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeUnorderedItem,
  kBlockTypeUnstyled,
} from "../../types.jsx";
import { joinClasses } from "../../../util/elClass.js";

export function getBlockStyle(blockType) {
  // TODO(akindyakov): Continue here applying custom styles for elements
  switch (blockType) {
    case kBlockTypeQuote:
      return "doc_block_blockquote";
    case kBlockTypeH1:
      return "doc_block_header_1";
    case kBlockTypeH2:
      return "doc_block_header_2";
    case kBlockTypeH3:
      return "doc_block_header_3";
    case kBlockTypeH4:
      return "doc_block_header_4";
    case kBlockTypeH5:
      return "doc_block_header_5";
    case kBlockTypeH6:
      return "doc_block_header_6";
    case kBlockTypeUnstyled:
      return "doc_block_unstyled";
    case kBlockTypeCode:
      return "doc_block_code";
    default:
      return null;
  }
}

export function getBlockStyleInDoc(blockType) {
  // TODO(akindyakov): Continue here applying custom styles for elements
  let blockStyle = getBlockStyle(blockType);
  switch (blockType) {
    case kBlockTypeQuote:
    case kBlockTypeH1:
    case kBlockTypeH2:
    case kBlockTypeH3:
    case kBlockTypeH4:
    case kBlockTypeH5:
    case kBlockTypeH6:
    case kBlockTypeUnstyled:
      blockStyle = joinClasses(blockStyle, "doc_block_paragraph");
  }
  return blockStyle;
}

const _BLOCK_NAMES = {
  [kBlockTypeH1]: "Header 1",
  [kBlockTypeH2]: "Header 2",
  [kBlockTypeH3]: "Header 3",
  [kBlockTypeH4]: "Header 4",
  [kBlockTypeH5]: "Header 5",
  [kBlockTypeH6]: "Header 6",
  [kBlockTypeQuote]: "\u201CQuote\u201D",
  [kBlockTypeUnorderedItem]: "Bullet list",
  [kBlockTypeOrderedItem]: "Numbered list",
  [kBlockTypeCode]: "{} Code",
  [kBlockTypeUnorderedCheckItem]: "Check list",
  [kBlockTypeUnstyled]: "Text",
};

export function getBlockName(blockType) {
  return _BLOCK_NAMES[blockType];
}
