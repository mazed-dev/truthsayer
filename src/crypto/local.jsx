import { encrypt, decrypt, sha1 } from "./wrapper";

import { toBase64, fromBase64 } from "./../util/base64";

const ls = require("local-storage");

interface TLocalSecretHash {
  hash: string;
  is_active: boolean;
}

interface TEncrypted {
  encrypted: Any;
  hash: string;
}

interface TStorage {
  get: (key: string) => string;
  set: (key: string, value: string) => void;
}

const kLastSecretHashKey = sha1("crypto/local/secret/last/hash");
const kAllSecretsHashesKey = sha1("crypto/local/secret/all/hashes");

export function localOnlyCrcSecretPush(
  secret: string,
  storage?: TStorage
): string {
  storage = storage || ls;
  const packed = toBase64(secret);
  const key = sha1(packed);

  let allSecretsHashes: Array<string> = storage.get(kAllSecretsHashesKey) || [];
  allSecretsHashes.push(key);

  // Store new
  storage.set(key, packed);
  // Swap last key
  storage.set(kLastSecretHashKey, key);
  // Sway hashes list
  storage.set(kAllSecretsHashesKey, allSecretsHashes);

  return key;
}

export function localOnlyCrcSecretGetAll(
  storage?: TStorage
): Array<TLocalSecretHash> {
  storage = storage || ls;
  const lastSecretHash: string = storage.get(kLastSecretHashKey);
  const allSecretsKeys: string = storage.get(kAllSecretsHashesKey);
  return allSecretsKeys.map((hash) => {
    const is_active = hash === lastSecretHash;
    return {
      hash: hash,
      is_active: is_active,
    };
  });
}

export function localOnlyCrcSecretLast(storage?: TStorage): string {
  storage = storage || ls;
  const lastSecretHash: string = storage.get(kLastSecretHashKey);
  return lastSecretHash;
}

export function localOnlyCrcDecryptObj(
  cipher: string,
  hash: string,
  storage?: TStorage
): Any | null {
  storage = storage || ls;
  const secretBase64 = storage.get(hash);
  if (secretBase64) {
    const secret = fromBase64(secretBase64);
    const str = decrypt(cipher, secret);
    return JSON.parse(str);
  }
  return null;
}

export function localOnlyCrcEncryptObj(
  data: Any,
  storage?: TStorage
): TEncrypted | null {
  storage = storage || ls;
  // TODO(akindyakov): Use global variable to cache active secret and keep it in memory for performance reasons.
  const lastSecretHash = storage.get(kLastSecretHashKey);
  if (lastSecretHash) {
    const lastSecret: string = fromBase64(storage.get(lastSecretHash));
    const encrypted = encrypt(JSON.stringify(data), lastSecret);
    return {
      encrypted: encrypted,
      hash: lastSecretHash,
    };
  }
  return null;
}
