import {
  decrypt,
  encrypt,
  sha1,
  sign,
  verify,
} from "./wrapper.jsx";

import {getSecondKey, getAnySecondKey} from "./../smugler/api";

import { base64 } from "./../util/base64.jsx";

const ls = require("local-storage");

interface TLocalSecretHash {
  hash: string;
  is_active: boolean;
}

interface TEncrypted {
  encrypted: string;
  secid: string;
  signature: string;
}

interface TSecret {
  id: string;
  key: string;
  sig: string;
}

interface TStorage {
  get: (key: string) => string;
  set: (key: string, value: string) => void;
}

export class LocalCrypto {
  static _instance = null;

  _uid: string = "";
  _storage: TStorage | null = null;
  _lastSecret: TSecret | null = null;

  constructor(
    uid: string,
    storage: TStorage,
    lastSecret: TSecret | null,
  ) {
    this._uid = uid;
    this._storage = storage;
    this._lastSecret = lastSecret;
  }

  static initInstance(
    uid: string,
    storage?: TStorage // Default one is local storage
  ): void {
    LocalCrypto._instance = new LocalCrypto(
      uid,
      storage || ls);
    return LocalCrypto._instance;
  }

  static getInstance(): LocalCrypto {
    return this._instance;
  }

  encryptObj(obj: Any): TEncrypted | null {
    if (!this._lastSecret) {
      return null;
    }
    const iv = makeIv();
    const encrypted = symmetricEncrypt(
      this._lastSecret.key,
      JSON.stringify(obj),
      iv,
    );
    const signature = signatureSign(this._lastSecret.sig, encrypted);
    return {
      encrypted: encrypted,
      secid: this._lastSecret.id,
      signature: signature,
    };
  }

  decryptObj(encrypted: TEncrypted): Any | null {
    const secret = this._getSecretByHash(hash);
    const str = decrypt(cipher, secret);
    return JSON.parse(str);
  }

  reEncryptObj(encrypted: TEncrypted): TEncrypted | null {
    const obj = this.decryptObj(cipher, hash);
    if (obj == null) {
      return null;
    }
    return this.encryptObj(obj);
  }

  appendSecret(secret: string): string | null {
    this._lastSecret = secret;
    if (this._sessionSecret && this._storage) {
      const hash = this._storeSecretToLocalStorage(secret, this._storage);
      this._lastSecretHash = hash;
      return hash;
    }
    return null;
  }

  getLastSecretHash(): string | null {
    return this._lastSecretHash;
  }

  getAllSecretHashes(): Array<TLocalSecretHash> {
    const lastSecretHash: string = this._storage.get(
      this._getLastSecretIdKey()
    );
    const allSecretsKeys: string = this._storage.get(
      this._getAllSecretIdsKey()
    );
    return allSecretsKeys.map((hash) => {
      const is_active = hash === lastSecretHash;
      return {
        hash: hash,
        is_active: is_active,
      };
    });
  }

  _getSecretByHash(hash: string): string | null {
    if (hash === this._lastSecretHash) {
      return this._lastSecret;
    }
    if (this._sessionSecret == null) {
      return null;
    }
    const secretBase64 = this._storage.get(hash);
    if (!secretBase64) {
      return null;
    }
    // TODO(akindyakov): add this hash to in-memory cache for performance
    return decrypt(base64.toStr(secretBase64), this._sessionSecret);
  }

  static _getLastSecretIdKey() {
    return sha1(this._uid + "//crypto/local/secret/last");
  }

  static _getAllSecretIdsKey() {
    return sha1(this._uid + "//crypto/local/secret/all");
  }

  async _storeSecretToLocalStorage(secret: string): string {
    const secondKey = await getAnySecondKey().data;
    const encryptedSecret = encrypt(secret, this._sessionSecret);
    const signature = sign(encryptedSecret, secondKey.sig);
    const encrypted: TEncrypted = {
      encrypted: encryptedSecret,
      secid: secondKey.id,
      signature: signature,
    };
    const secretId = sha1(secret);

    let allSecretsHashes: Array<string> = [];
    const allSecretsHashesKey = this._getAllSecretIdsKey();
    let allSecretsHashesStr: string | null =
      this._storage.get(allSecretsHashesKey);
    if (allSecretsHashesStr != null) {
      allSecretsHashes = base64.toObject(allSecretsHashesStr);
    }
    allSecretsHashes.push(key);

    // Store new
    this._storage.set(secretId, base64.fromObject(encrypted));
    // Sway hashes list
    this._storage.set(allSecretsHashesKey, allSecretsHashes);
    // Swap last key
    this._storage.set(this._getLastSecretIdKey(), secretId);

    return secretId;
  }

  static async function respawnLocalCrypto(
    uid: string,
    storage: TStorage,
    cancelToken: Any,
  ): LocalCrypto {
    const lastSecretId = storage.get(LocalCrypto._getLastSecretIdKey());
    const lastSecretBase64 = this._storage.get(lastSecretId);
    if (lastSecretBase64 == null) {
      console.log("Error: local user secret is not defined");
      return;
    }
    const lastSecretEnc: TEncrypted = base64.toObject(lastSecretBase64);

    const secondKey = await getSecondKey({
      id: lastSecretEnc.secid, cancelToken: cancelToken,
    }).data;

    if (!verify(lastSecretEnc.sig, lastSecretEnc.encrypted, secondKey.sig)) {
      console.log("Error: signature of encrypted local key is corrupted");
      return;
    }
    const keyStr = decrypt(
      lastSecretEnc.encrypted,
      secondKey.key,
    );
    const lastSecret: TSecret = base64.toObject(keyStr);

    return new LocalCrypto(
      uid,
      storage,
      lastSecret,
    );
  }
}

