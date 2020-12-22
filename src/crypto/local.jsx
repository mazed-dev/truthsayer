import {
  TEncrypted,
  TSecret,
  decryptSignedObject,
  encryptAndSignObject,
  makeSecret,
  sha1,
} from "./wrapper.jsx";

import { getSecondKey, getAnySecondKey } from "./../smugler/api";

import { base64 } from "./../util/base64.jsx";

const ls = require("local-storage");

interface TLocalSecretHash {
  hash: string;
  is_active: boolean;
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

  constructor(uid: string, storage: TStorage, lastSecret: TSecret | null) {
    this._uid = uid;
    this._storage = storage;
    this._lastSecret = lastSecret;
  }

  static initInstance(
    uid: string,
    storage?: TStorage // Default one is local storage
  ): void {
    LocalCrypto._instance = new LocalCrypto(uid, storage || ls);
    return LocalCrypto._instance;
  }

  static getInstance(): LocalCrypto {
    return this._instance;
  }

  async encryptObj(obj: Any): TEncrypted | null {
    if (!this._lastSecret) {
      return null;
    }
    const encrypted: TEncrypted = encryptAndSignObject(obj, this._lastSecret);
    return encrypted;
  }

  async decryptObj(encrypted: TEncrypted): Any | null {
    const secret = await _getSecretByHash(encrypted.secret_id);
    if (secret == null) {
      return null;
    }
    return await decryptSignedObject(encrypted, secret);
  }

  reEncryptObj(encrypted: TEncrypted): TEncrypted | null {
    const obj = this.decryptObj(encrypted);
    if (obj == null) {
      return null;
    }
    return this.encryptObj(obj);
  }

  appendSecret(secretPhrase: string, signaturePhrase: string): string | null {
    if (this._storage) {
      const secret = this._storeSecretToLocalStorage(
        secretPhrase,
        signaturePhrase
      );
      this._lastSecret = secret;
      this._storage.set(this._getLastSecretIdKey(), secret.id);
      return secret.id;
    }
    return null;
  }

  getLastSecretId(): string | null {
    return this._lastSecret.id;
  }

  getAllSecretIds(): Array<TLocalSecretHash> {
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

  static _getLastSecretIdKey() {
    return sha1(this._uid + "//crypto/local/secret/last");
  }

  static _getAllSecretIdsKey() {
    return sha1(this._uid + "//crypto/local/secret/all");
  }

  async _getSecretByHash(secret_id: string): TSecret | null {
    if (hash === this._lastSecret.id) {
      return this._lastSecret;
    }
    const secretBase64 = this._storage.get(secret_id);
    if (!secretBase64) {
      console.log("Error: local user secret is not defined");
      return null;
    }
    const secretEnc: TEncrypted = base64.toObject(secretBase64);
    const secondKey = await getSecondKey({
      id: secretEnc.secret_id,
    }).data;
    const secret: TSecret = decryptSignedObject(secretEnc, secondKey);
    return secret;
  }

  async _storeSecretToLocalStorage(
    secretPhrase: string,
    signaturePhrase: string
  ): TSecret {
    const secondKey: TSecret = await getAnySecondKey().data;
    const secret: TSecret = makeSecret(secretPhrase, signaturePhrase);

    const encryptedSecret: TEncrypted = await encryptAndSignObject(
      secret,
      secondKey
    );

    let allSecretsHashes: Array<string> = [];
    const allSecretsHashesKey = this._getAllSecretIdsKey();
    let allSecretsHashesStr: string | null = this._storage.get(
      allSecretsHashesKey
    );
    if (allSecretsHashesStr != null) {
      allSecretsHashes = base64.toObject(allSecretsHashesStr);
    }
    allSecretsHashes.push(key);

    // Store new
    this._storage.set(secret.id, base64.fromObject(encryptedSecret));
    // Sway hashes list
    this._storage.set(allSecretsHashesKey, allSecretsHashes);

    return secret;
  }

  static async respawnLocalCrypto(): void {
    if (this._lastSecret == null) {
      const lastSecretId = storage.get(LocalCrypto._getLastSecretIdKey());
      const lastSecret = await this._getSecretByHash(lastSecretId);
      this._lastSecret = lastSecret;
    }
  }
}
