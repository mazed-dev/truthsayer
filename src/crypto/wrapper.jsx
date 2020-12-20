import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import Pkcs7 from "crypto-js/pad-pkcs7";

import { toBase64, fromBase64 } from "./../util/base64.jsx";

const shajs = require("sha.js");

export const encrypt = (text: string, passphrase: string): string => {
  const encrypted = AES.encrypt(text, passphrase, {
    // default mode CBC,
    padding: Pkcs7,
  });
  return encrypted.toString();
};

export const decrypt = (ciphertext: string, passphrase: string): string => {
  const bytes = AES.decrypt(ciphertext, passphrase);
  const originalText: string = bytes.toString(Utf8);
  return originalText;
};

export const sha1 = (str: string): string => {
  return shajs("sha1").update(str).digest("hex");
};

/// Convert string to array
function str2ArrayBuffer(str: string): ArrayBuffer {
  let encoder;
  if ("TextEncoder" in window) {
    encoder = new TextEncoder();
  } else {
    const { TextEncoder } = require('util');
    encoder = new TextEncoder();
  }
  return encoder.encode(str);
}

function arrayBuffer2Str(ab: ArrayBuffer): string {
  let dec;
  if ("TextDecoder" in window) {
    dec = new TextDecoder("utf-8");
  } else {
    const { TextDecoder } = require('util');
    dec = new TextDecoder();
  }
  return dec.decode(ab);
}

/// Symmetric
const kSymmetricAlgo = "AES-CBC";
const kSymmetricAlgoLength = 256;
const kSymmetricIvLength = 16;

// Generate keys
export async function symmetricMakeKeys() {
  return await kWebCryptoApiSubtle.generateKey(
    { name: kSymmetricAlgo, length: kSymmetricAlgoLength },
    true,
    ["encrypt", "decrypt"]
  );
}

// Import an AES secret key from an base64 text
export async function importSecretBase64Key(base64Key: string) {
  const bytes = str2ArrayBuffer(
    await fromBase64(base64Key)
  );
  return kWebCryptoApiSubtle.importKey(
    "raw",
    bytes,
    kSymmetricAlgo,
    true,
    ["encrypt", "decrypt"]
  );
}

// Export key
// export as
// const result = crypto.subtle.exportKey(format, key);
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey

// Make IV
export function makeIv() {
  return kWebCryptoApi.getRandomValues(new Uint8Array(kSymmetricIvLength));
}

// Encrypt
export async function symmetricEncrypt(key, str: string, iv) {
  const bytes = str2ArrayBuffer(str);
  return await kWebCryptoApiSubtle.encrypt(
    { name: kSymmetricAlgo, iv: iv },
    key,
    bytes
  );
}

// Decrypt
export async function symmetricDecrypt(key, encrypted, iv): string {
  const bytes = await kWebCryptoApiSubtle.decrypt(
    { name: kSymmetricAlgo, iv: iv },
    key,
    encrypted
  );
  return arrayBuffer2Str(bytes);
}

/// Signature
const kSignatureAlgo = "HMAC";
const kSignatureHashAlgo = "SHA-256";
const kSignatureNamedCurve = "P-256";

// Generate keys
export function signatureGenerateKeys() {
  return kWebCryptoApiSubtle.generateKey(
    { name: kSignatureAlgo, namedCurve: kSignatureNamedCurve },
    false,
    ["sign", "verify"]
  );
}

// Sign
export function signatureSign(privateKey, data) {
  return kWebCryptoApiSubtle.sign(
    { name: kSignatureAlgo, hash: { name: kSignatureHashAlgo } },
    privateKey,
    data
  );
}

// Verify
export function signatureVerify(publicKey, signature, data) {
  return kWebCryptoApiSubtle.verify(
    { name: kSignatureAlgo, hash: { name: kSignatureHashAlgo } },
    publicKey,
    signature,
    data
  );
}

export function areWeTestingWithJest() {
  return process.env.JEST_WORKER_ID !== undefined;
}

function _getSubtle() {
  if (areWeTestingWithJest()) {
    const { Crypto } = require("@peculiar/webcrypto");
    const crypto = new Crypto();
    return crypto;
  }
  return window.crypto;
}

const kWebCryptoApi = _getSubtle();
const kWebCryptoApiSubtle = kWebCryptoApi.subtle;
