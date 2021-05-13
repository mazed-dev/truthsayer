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
} from "../types.jsx";

export function getBlockStyle(blockType) {
  // TODO(akindyakov): Continue here applying custom styles for elements
  switch (blockType) {
    case kBlockTypeQuote:
      return "doc_component_blockquote";
    case kBlockTypeH1:
      return "doc_component_header_1";
    case kBlockTypeH2:
      return "doc_component_header_2";
    case kBlockTypeH3:
      return "doc_component_header_3";
    case kBlockTypeH4:
      return "doc_component_header_4";
    case kBlockTypeH5:
      return "doc_component_header_5";
    case kBlockTypeH6:
      return "doc_component_header_6";
    case kBlockTypeUnstyled:
      return "doc_component_paragraph";
    default:
      return null;
  }
}

const _BLOCK_NAMES = {
  [kBlockTypeH1]: "Header 1",
  [kBlockTypeH2]: "Header 2",
  [kBlockTypeH3]: "Header 3",
  [kBlockTypeH4]: "Header 4",
  [kBlockTypeH5]: "Header 5",
  [kBlockTypeH6]: "Header 6",
  [kBlockTypeQuote]: "Quote",
  [kBlockTypeUnorderedItem]: "Bullet list",
  [kBlockTypeOrderedItem]: "Numbered list",
  [kBlockTypeCode]: "Code",
  [kBlockTypeUnorderedCheckItem]: "Check list",
  [kBlockTypeUnstyled]: "Text",
};

export function getBlockName(blockType) {
  return _BLOCK_NAMES[blockType];
}
