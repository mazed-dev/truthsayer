import {
  symmetricMakeKeys,
  makeIv,
  symmetricEncrypt,
  symmetricDecrypt,
  importSecretBase64Key,
  importSecretBase64Signature,
} from './web_crypto_api'

test('crypto web api: encrypt & decrypt', async () => {
  const key = await symmetricMakeKeys()
  expect(key.type).toStrictEqual('secret')
  expect(key.algorithm.length).toStrictEqual(256)
  expect(key.algorithm.name).toStrictEqual('AES-CBC')

  const toEncrypt = 'The Nutcracker (ballet), Op.71'

  const iv = makeIv()
  const encrypted = await symmetricEncrypt(key, toEncrypt, iv)
  const decrypted = await symmetricDecrypt(key, encrypted, iv)
  expect(decrypted).toStrictEqual(toEncrypt)
})

test('crypto web api: importSecretBase64Key', async () => {
  const base64Key = 'TW96aWxsYS81LjAgKFgxMQ=='
  await importSecretBase64Key(base64Key)
})

test('crypto web api: importSecretBase64Signature', async () => {
  const base64Key = 'TW96aWxsYS81LjAgKFgxMWFzZGZzYWRmc2E='
  await importSecretBase64Signature(base64Key)
})
