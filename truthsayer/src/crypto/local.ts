import {
  TEncrypted,
  TSecret,
  decryptSignedObject,
  encryptAndSignObject,
  genSecretPhrase,
  genSecretPhraseToRender,
  makeSecret,
  sha1,
} from './wrapper.js'

import { smuggler } from 'smuggler-api'

import { base64 } from 'armoury'

// @ts-ignore: Could not find a declaration file for module 'local-storage'
import ls from 'local-storage'

interface TLocalSecretHash {
  id: string
  is_active: boolean
}

interface TStorage {
  get: (key: string) => string
  set: (key: string, value: string) => void
  remove: (key: string) => void
}

export class LocalCrypto {
  static _instance: null | LocalCrypto = null

  _uid: string = ''
  _storage: TStorage
  _lastSecret: TSecret | null = null
  _smuggler: any

  constructor(
    uid: string,
    storage?: TStorage,
    remote?: any,
    lastSecret?: TSecret
  ) {
    this._uid = uid
    this._storage = storage || (ls as unknown as TStorage)
    this._smuggler = remote || smuggler
    this._lastSecret = lastSecret || null
  }

  static async initInstance(
    uid: string,
    storage?: TStorage, // Default one is local storage
    remote?: any
  ): Promise<LocalCrypto> {
    const instance = new LocalCrypto(uid, storage, remote)
    await instance.respawnLocalCrypto()
    LocalCrypto._instance = instance
    return LocalCrypto._instance
  }

  static getInstance(): LocalCrypto {
    if (!this._instance) {
      throw 'Failed to get LocalCrypto instance, initInstance() has to be called first'
    }
    return this._instance
  }

  has(secret_id?: string): boolean {
    if (secret_id) {
      return !!this._lastSecret && this._lastSecret.id === secret_id
    }
    return this._lastSecret != null
  }

  async encryptObj(obj: any): Promise<TEncrypted | null> {
    if (!this._lastSecret) {
      return null
    }
    const encrypted: TEncrypted = encryptAndSignObject(obj, this._lastSecret)
    return encrypted
  }

  async decryptObj(encrypted: TEncrypted): Promise<any | null> {
    const secret = await this._getSecretById(encrypted.secret_id)
    if (secret == null) {
      return null
    }
    return await decryptSignedObject(encrypted, secret)
  }

  async reEncryptObj(encrypted: TEncrypted): Promise<TEncrypted | null> {
    const obj = this.decryptObj(encrypted)
    if (obj == null) {
      return null
    }
    return this.encryptObj(obj)
  }

  async appendSecret(secretPhrase: string): Promise<string | null> {
    const secret = await this._storeSecretToLocalStorage(secretPhrase)
    this._lastSecret = secret
    this._storage.set(this._getLastSecretIdKey(), secret.id)
    return secret.id
  }

  async deleteLastSecret(): Promise<void> {
    if (this._lastSecret != null) {
      this._storage.remove(this._lastSecret.id)
      this._lastSecret = null
      this._storage.remove(this._getLastSecretIdKey())
      this._storage.remove(this._getAllSecretIdsKey())
    }
  }

  getLastSecretId(): string | null {
    if (this._lastSecret) {
      return this._lastSecret.id
    }
    return null
  }

  getLastSecretPhrase(): string | null {
    if (this._lastSecret != null) {
      return genSecretPhrase(this._lastSecret)
    }
    return null
  }

  getLastSecretPhraseToRender(): string | null {
    if (this._lastSecret != null) {
      return genSecretPhraseToRender(this._lastSecret)
    }
    return null
  }

  getAllSecretIds(): Array<TLocalSecretHash> {
    const allSecretsKeys: string = this._storage.get(this._getAllSecretIdsKey())
    // @ts-ignore: Property 'map' does not exist on type 'string'
    return allSecretsKeys.map((secret_id: string) => {
      const is_active = secret_id === this._lastSecret?.id
      return {
        id: secret_id,
        is_active,
      }
    })
  }

  _getLastSecretIdKey() {
    return sha1(`${this._uid}//crypto/local/secret/last`)
  }

  _getAllSecretIdsKey() {
    return sha1(`${this._uid}//crypto/local/secret/all`)
  }

  async _getSecretById(secret_id: string): Promise<TSecret | null> {
    if (this._lastSecret && secret_id === this._lastSecret.id) {
      return this._lastSecret
    }
    const secretBase64 = this._storage.get(secret_id)
    if (!secretBase64) {
      // *dbg*/ console.log('Error: local user secret is not defined', secret_id)
      return null
    }
    const secretEnc: TEncrypted = base64.string.toObject(secretBase64)
    const secondKeyData = await this._smuggler.getSecondKey({
      id: secretEnc.secret_id,
    })
    const secondKey: TSecret = {
      id: secondKeyData.id,
      key: secondKeyData.key,
      sig: secondKeyData.sig,
    }
    const secret: TSecret = decryptSignedObject(secretEnc, secondKey)
    return secret
  }

  async _storeSecretToLocalStorage(secretPhrase: string): Promise<TSecret> {
    const secondKeyData = await this._smuggler.getAnySecondKey()
    // {
    //   key: String,
    //   length: u32,
    //   sig: String,
    //   sig_length: u32,
    //   id: String,
    //   is_expired: bool,
    //   expires_at: i64,
    //   issued_at: i64,
    // }
    const secondKey: TSecret = {
      id: secondKeyData.id,
      key: secondKeyData.key,
      sig: secondKeyData.sig,
    }
    const secret: TSecret = makeSecret(secretPhrase)

    const encryptedSecret: TEncrypted = await encryptAndSignObject(
      secret,
      secondKey
    )

    const allSecretsHashesKey = this._getAllSecretIdsKey()
    // @ts-ignore: Type 'string' is not assignable to type 'string[]
    const allSecretsHashes: Array<string> =
      this._storage.get(allSecretsHashesKey) || []
    allSecretsHashes.push(secret.id)

    // Store new
    this._storage.set(secret.id, base64.string.fromObject(encryptedSecret))
    // Swap hashes list
    // @ts-ignore: Argument of type 'string[]' is not assignable to parameter of type 'string'
    this._storage.set(allSecretsHashesKey, allSecretsHashes)

    return secret
  }

  async respawnLocalCrypto(): Promise<void> {
    const lastSecretId = this._storage.get(this._getLastSecretIdKey())
    if (lastSecretId) {
      const lastSecret = await this._getSecretById(lastSecretId)
      this._lastSecret = lastSecret
    }
  }
}
