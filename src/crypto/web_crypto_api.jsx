import { base64 } from "./../util/base64.jsx";

/// Convert string to array
function str2ArrayBuffer(str: string): ArrayBuffer {
  let encoder;
  if ("TextEncoder" in window) {
    encoder = new TextEncoder();
  } else {
    const { TextEncoder } = require("util");
    encoder = new TextEncoder();
  }
  return encoder.encode(str);
}

function arrayBuffer2Str(ab: ArrayBuffer): string {
  let dec;
  if ("TextDecoder" in window) {
    dec = new TextDecoder("utf-8");
  } else {
    const { TextDecoder } = require("util");
    dec = new TextDecoder();
  }
  return dec.decode(ab);
}

interface TEncrypted {
  encrypted: string;
  iv: string;
  signature: string;
}

interface TUserLocalKey {
  id: string;
  key: ArrayBuffer;
  sig: ArrayBuffer;
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
  const bytes = base64.toByteArray(base64Key);
  return await kWebCryptoApiSubtle.importKey(
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
export async function symmetricEncrypt(key, str: string, iv: ArrayBuffer) {
  const bytes = str2ArrayBuffer(str);
  const encryptedBytes = await kWebCryptoApiSubtle.encrypt(
    { name: kSymmetricAlgo, iv: iv },
    key,
    bytes
  );
  return base64.fromByteArray(encryptedBytes);
}

// Decrypt
export async function symmetricDecrypt(
  key,
  encrypted,
  iv: ArrayBuffer
): string {
  const encryptedBytes = base64.toByteArray(encrypted);
  const decryptedBytes = await kWebCryptoApiSubtle.decrypt(
    { name: kSymmetricAlgo, iv: iv },
    key,
    encryptedBytes
  );
  // return base64.fromByteArray(decryptedBytes);
  return arrayBuffer2Str(decryptedBytes);
}

/// Signature
const kSignatureName = "HMAC";
const kSignatureHashAlgo = "SHA-256";
const kSignatureAlgo = {
  name: kSignatureName,
  hash: {
    name: kSignatureHashAlgo,
  },
};
const kSignatureNamedCurve = "P-256";

// Generate keys
export async function signatureGenerateKeys() {
  return await kWebCryptoApiSubtle.generateKey(kSignatureAlgo, true, [
    "sign",
    "verify",
  ]);
}

// Import an AES secret key from an base64 text
export async function importSecretBase64Signature(base64Sig: string) {
  const bytes: ArrayBuffer = base64.toByteArray(base64Sig);
  // for (let l of bytes.values()) {
  //   throw l;
  // }
  return await kWebCryptoApiSubtle.importKey(
    "raw",
    bytes,
    kSignatureAlgo,
    true,
    ["sign", "verify"]
  );
}

// Sign
export async function signatureSign(privateKey, data) {
  return await kWebCryptoApiSubtle.sign(kSignatureAlgo, privateKey, data);
}

// Verify
export async function signatureVerify(publicKey, signature, data) {
  return await kWebCryptoApiSubtle.verify(
    kSignatureAlgo,
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
    // const { Crypto } = require("@peculiar/webcrypto");
    // const crypto = new Crypto();
    const crypto = require("@trust/webcrypto");
    return crypto;
  }
  return window.crypto;
}

const kWebCryptoApi = _getSubtle();
const kWebCryptoApiSubtle = kWebCryptoApi.subtle;
