import { TDoc } from './../doc/types'

import moment from 'moment'

export interface TNode {
  nid: string;

  // There is no proper Unions or typed Enums in TypeScript, so I used optional
  // fields to represent different types of node: image or text document.
  doc: TDoc | null;
  image: TImage | null;

  created_at: moment;
  updated_at: moment;

  // Attributes of a node to be serialised and encrypted before submiting to the
  // server with local secret key
  attrs: TNodeAttrs | null;

  // Information about node security
  crypto: TNodeCrypto;
}

export interface TNodeCrypto {
  // Ideally encryption/decryption happens in a layer below TNode, so if code
  // uses TNode object it should not use encryption at all. But layers above
  // should be aware if node is encrypted, successfuly decrypted or
  // unsuccessfuly decrypted and why.
  success: boolean;
  secret_id: string | null;
}

export interface TNodeAttrs {
  ngrams: Array<string>;
  salt: string;
}

export interface TImage {}
