import { encrypt, decrypt, sha1 } from "./wrapper";

import { toBase64, fromBase64 } from "./../util/base64.jsx";

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

export class LocalCrypto {
  static myInstance = null;

  _uid: string = "";
  _storage: TStorage | null = null;
  _lastSecretHash: string | null = null;
  _lastSecret: string | null = null;

  // All local secrets will be encrypted in local-storage
  // with this session secret
  _sessionSecret: string | null = null;

  constructor(uid: string, sessionSecret: string, storage: TStorage) {
    this._uid = uid;
    this._storage = storage;
    this._sessionSecret = sessionSecret;

    const lastSecretHash = this._storage.get(this._getLastSecretHashKey());
    if (lastSecretHash) {
      this._lastSecret = this._getSecretByHash(lastSecretHash);
      this._lastSecretHash = lastSecretHash;
    }
  }

  static initInstance(
    uid: string,
    sessionSecret: string,
    storage?: TStorage
  ): void {
    LocalCrypto.myInstance = new LocalCrypto(uid, storage || ls);
  }

  static getInstance(): LocalCrypto {
    return this.myInstance;
  }

  encryptObj(obj: Any): TEncrypted | null {
    if (!this._lastSecret || !this._lastSecretHash) {
      return null;
    }
    const encrypted = encrypt(JSON.stringify(obj), this._lastSecret);
    return {
      encrypted: encrypted,
      hash: this._lastSecretHash,
    };
  }

  decryptObj(cipher: string, hash: string): Any | null {
    const secret = this._getSecretByHash(hash);
    const str = decrypt(cipher, secret);
    return JSON.parse(str);
  }

  reEncryptObj(cipher: string, hash: string): TEncrypted | null {
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
      this._getLastSecretHashKey()
    );
    const allSecretsKeys: string = this._storage.get(
      this._getAllSecretsHashesKey()
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
    return decrypt(fromBase64(secretBase64), this._sessionSecret);
  }

  _getLastSecretHashKey() {
    return sha1(this._uid + "/crypto/local/secret/last/hash");
  }

  _getAllSecretsHashesKey() {
    return sha1(this._uid + "/crypto/local/secret/all/hashes");
  }

  _storeSecretToLocalStorage(secret: string): string {
    const encryptedSecret = encrypt(secret, this._sessionSecret);
    const packed = toBase64(encryptedSecret);
    const key = sha1(packed);

    const allSecretsHashesKey = this._getAllSecretsHashesKey();
    let allSecretsHashes: Array<string> =
      this._storage.get(allSecretsHashesKey) || [];
    allSecretsHashes.push(key);

    // Store new
    this._storage.set(key, packed);
    // Swap last key
    this._storage.set(this._getLastSecretHashKey(), key);
    // Sway hashes list
    this._storage.set(allSecretsHashesKey, allSecretsHashes);

    return key;
  }
}
