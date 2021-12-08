// @ts-nocheck

import AES from 'crypto-js/aes'
import Base64 from 'crypto-js/enc-base64'
import HmacSHA256 from 'crypto-js/hmac-sha256'
import Pkcs7 from 'crypto-js/pad-pkcs7'
import SHA1 from 'crypto-js/sha1'
import Utf8 from 'crypto-js/enc-utf8'

import { base64 } from './../util/base64'

export interface TEncrypted {
  encrypted: string
  secret_id: string
  signature: string
}

export interface TSecret {
  id: string
  key: string
  sig: string
}

export const encrypt = (text: string, passphrase: string): string => {
  const encrypted = AES.encrypt(text, passphrase, {
    // default mode CBC,
    padding: Pkcs7,
  })
  return encrypted.toString()
}

export const decrypt = (ciphertext: string, passphrase: string): string => {
  const bytes = AES.decrypt(ciphertext, passphrase)
  const originalText: string = bytes.toString(Utf8)
  return originalText
}

export const sha1 = (str: string): string => {
  return Base64.stringify(SHA1(str))
}

export const sign = (data: string, passphrase: string): string => {
  return Base64.stringify(HmacSHA256(data, passphrase))
}

export const verify = (
  signature: string,
  data: string,
  passphrase: string
): boolean => {
  return signature === sign(data, passphrase)
}

export function makeSecret(secretPhrase: string): TSecret {
  const signatureLength = Math.min(Math.round(secretPhrase.length / 2), 16)
  const signaturePhrase = secretPhrase.slice(0, signatureLength)
  const keyPhrase = secretPhrase.slice(signatureLength)
  const id = sha1(`${signaturePhrase}a${keyPhrase}`)
  const secret: TSecret = {
    id,
    key: keyPhrase,
    sig: signaturePhrase,
  }
  return secret
}

export function genSecretPhrase(secret: TSecret): string {
  return secret.sig + secret.key
}

export function genSecretPhraseToRender(secret: TSecret): string {
  return `${secret.sig} ${secret.key}`
}

export async function encryptAndSignObject(
  obj: Any,
  secret: TSecret
): TEncrypted {
  const encrypted = encrypt(base64.fromObject(obj), secret.key)
  const signature = sign(encrypted, secret.sig)
  const encryptedObj: TEncrypted = {
    encrypted,
    secret_id: secret.id,
    signature,
  }
  return encryptedObj
}

export async function decryptSignedObject(
  encryptedObj: TEncrypted,
  secret: TSecret
): Any | null {
  if (secret.id !== encryptedObj.secret_id) {
    // *dbg*/ console.log('Error: secret id missmatch')
    return null
  }
  if (!verify(encryptedObj.signature, encryptedObj.encrypted, secret.sig)) {
    // *dbg*/ console.log('Error: signature of encrypted object is corrupted')
    return null
  }
  const secretStr = decrypt(encryptedObj.encrypted, secret.key)
  return base64.toObject(secretStr)
}
