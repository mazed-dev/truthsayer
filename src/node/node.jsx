import { TDoc } from "./../doc/types";

import moment from "moment";

export interface TNode {
  // There is no proper Unions or typed Enums in TypeScript, so I used optional
  // fields to represent different types of node: image or text document.
  doc: TDoc | null;
  image: TImage | null;

  created_at: moment;
  updated_at: moment;

  // Information about node security
  crypto: TNodeCrypto;
}

export interface TNodeCrypto {
  // Ideally encryption/decryption happens in a layer below TNode, so if code
  // uses TNode object it should not use encryption at all. But layers above
  // should be aware if node is encrypted, successfuly decrypted or
  // unsuccessfuly decrypted and why.
  encrypted: boolean;
  success: boolean;
  message: string | null;
}

export interface TImage {}
