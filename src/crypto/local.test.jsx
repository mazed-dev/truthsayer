import { LocalCrypto } from './local.jsx'

class LocalStorageMock {
  storage: object = {}

  get(key: string): string {
    return this.storage[key]
  }

  set(key: string, value: string): void {
    this.storage[key] = value
  }

  remove(key: string): void {
    delete this.storage[key]
  }
}

const kUid = 'abc'
const kUid2 = 'cde'

const kSecondKey = 'o94sjpysxcgjtiaybko6sjyfr6kixyxct7msr3jy18r9q'
const kSecondKeyId = '9g6czuNkVvhgple/fdvMug'
const kSecondKeySig = 'Soqfwx3BWkuHuxRbBds64L8jM+Q'

const mockSmugler = {
  getSecondKey: async () => {
    return {
      key: kSecondKey,
      sig: kSecondKeySig,
      id: kSecondKeyId,
      is_expired: false,
    }
  },
  getAnySecondKey: async () => {
    return {
      key: kSecondKey,
      sig: kSecondKeySig,
      id: kSecondKeyId,
      is_expired: false,
    }
  },
}

test('push secret & get last & get all & push one more', async () => {
  const storage = new LocalStorageMock()
  const lc = new LocalCrypto(kUid, storage, mockSmugler)

  const secret = '<>|<f><n><t>)[<>]!@#$%^&*()_+284j1hXWJLRKl5LL0yP8eQ'
  const secretId = await lc.appendSecret(secret)

  expect(lc.getLastSecretId()).toStrictEqual(secretId)
  expect(lc.getAllSecretIds()).toStrictEqual([
    {
      id: secretId,
      is_active: true,
    },
  ])

  const secret2 = 'rnp4c74qmuyew71i9zs(*&%^)2xaDRF8rx4c+4+BvdnbcIQ'
  const secretId2 = await lc.appendSecret(secret2)

  expect(lc.getLastSecretId()).toStrictEqual(secretId2)
  expect(lc.getAllSecretIds()).toStrictEqual([
    {
      id: secretId,
      is_active: false,
    },
    {
      id: secretId2,
      is_active: true,
    },
  ])
})

test('push secret & get last & encrypt & decrypt', async () => {
  const storage = new LocalStorageMock()
  const lc = new LocalCrypto(kUid, storage, mockSmugler)

  const secret = '[<nm-fm>]!@#$%^&*()_+PZNe07IUtx+u8+jpmfav1w'
  const secretId = await lc.appendSecret(secret)
  expect(lc.getLastSecretId()).toStrictEqual(secretId)

  const value = {
    theRuleIsThis: {
      that: {
        wherever: 'there',
        is: 'a decision of a Court',
        type: -123,
      },
      of_concurrent: 'jurisdiction',
    },
    theOther: 'Courts will adopt',
    thatAs: [2, 'the', 'basis', 'of', 'their', 'decision'],
  }

  const encrypted = await lc.encryptObj(value)

  expect(encrypted.secret_id).toStrictEqual(secretId)

  const gotValue = await lc.decryptObj(encrypted)

  expect(gotValue).toStrictEqual(value)
})

test('push secret & delete crypto manager & create manager again and see that secret persists', async () => {
  const storage = new LocalStorageMock()
  let lc = new LocalCrypto(kUid, storage, mockSmugler)

  const secret = '1u87nidcbqxo7ytm1u5swogrqy3c9zyjr39t6f4mmf154TABozjIU8s'
  const secretId = await lc.appendSecret(secret)

  expect(lc.getLastSecretId()).toStrictEqual(secretId)
  expect(lc.getAllSecretIds()).toStrictEqual([
    {
      id: secretId,
      is_active: true,
    },
  ])

  const secret2 = 'xB61aZU0jXE5P0fsnHUGLc'
  const secretId2 = await lc.appendSecret(secret2)

  expect(lc.getLastSecretId()).toStrictEqual(secretId2)
  expect(lc.getAllSecretIds()).toStrictEqual([
    {
      id: secretId,
      is_active: false,
    },
    {
      id: secretId2,
      is_active: true,
    },
  ])

  // Recreate crypto manager with the same uid and on the same storage
  lc = new LocalCrypto(kUid, storage, mockSmugler)
  await lc.respawnLocalCrypto()

  expect(lc.getLastSecretId()).toStrictEqual(secretId2)
  expect(lc.getAllSecretIds()).toStrictEqual([
    {
      id: secretId,
      is_active: false,
    },
    {
      id: secretId2,
      is_active: true,
    },
  ])
})

test('Two crypto managers for different users that share storage should not have collisions', async () => {
  const storage = new LocalStorageMock()
  const lc = new LocalCrypto(kUid, storage, mockSmugler)
  const lc2 = new LocalCrypto(kUid2, storage, mockSmugler)

  const secret = '1u87nidcbqxo7ytm1u5swogrqy3c9zyjr39t6f4mm'
  const secretId = await lc.appendSecret(secret)

  const secret2 = 'p3y7kpqt9wfx4khihzh13hx8sg48a9bht3tu5opr'
  const secretId2 = await lc2.appendSecret(secret2)

  expect(lc.getLastSecretId()).toStrictEqual(secretId)
  expect(lc.getAllSecretIds()).toStrictEqual([
    {
      id: secretId,
      is_active: true,
    },
  ])

  expect(lc2.getLastSecretId()).toStrictEqual(secretId2)
  expect(lc2.getAllSecretIds()).toStrictEqual([
    {
      id: secretId2,
      is_active: true,
    },
  ])
})

test('hashes of last secret and all secrets do not collide', () => {
  const storage = new LocalStorageMock()
  const lc = new LocalCrypto(kUid, storage, mockSmugler)
  expect(lc._getLastSecretIdKey()).not.toStrictEqual(lc._getAllSecretIdsKey())
})

test('init and access singleton', async () => {
  const storage = new LocalStorageMock()
  let lc = new LocalCrypto(kUid, storage, mockSmugler)

  const secret = 'nidcbqxo7ytm1u5swogrqy3c9zyjr39t6f4mmf154'
  const secretId = await lc.appendSecret(secret)

  expect(lc.getLastSecretId()).toStrictEqual(secretId)

  // Init LocalCrypto singleton on the same storage
  await LocalCrypto.initInstance(kUid, storage, mockSmugler)
  lc = LocalCrypto.getInstance()
  expect(lc.getLastSecretId()).toStrictEqual(secretId)
})

test('does not encrypt without local key', async () => {
  const storage = new LocalStorageMock()
  const lc = new LocalCrypto(kUid, storage, mockSmugler)
  const value = {
    theRuleIsThis: {
      that: {
        wherever: 'there',
      },
    },
  }
  const encrypted = await lc.encryptObj(value)
  expect(encrypted).toBeNull()
})

test('deleteLastSecret', async () => {
  const storage = new LocalStorageMock()
  const lc = new LocalCrypto(kUid, storage, mockSmugler)

  const secret = 'nidcbqxo7ytm1u5swogrqy3c9zyjr39t6f4mmf154'
  const secretId = await lc.appendSecret(secret)

  expect(lc.getLastSecretId()).toStrictEqual(secretId)

  await lc.deleteLastSecret()
  expect(lc.getLastSecretId()).toBeNull()
})
