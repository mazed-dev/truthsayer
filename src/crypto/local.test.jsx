import { LocalCrypto } from "./local.jsx";

class LocalStorageMock {
  storage: object = {};

  get(key: string): string {
    return this.storage[key];
  }

  set(key: string, value: string): void {
    this.storage[key] = value;
  }
}

const kUid = "abc";
const kSessionSecret = "o94sjpysxcgjtiaybko6sjyfr6kixyxct7msr3jy18r9q";

const kUid2 = "cde";
const kSessionSecret2 = "babel.parser.src.parser.expression.js:348:23";

test("push secret & get last & get all & push one more", () => {
  let storage = new LocalStorageMock();
  let lc = new LocalCrypto(kUid, kSessionSecret, storage);

  const secret = "<>|<f><n><t>)[<>]!@#$%^&*()_+";
  const secretHash = lc.appendSecret(secret);

  expect(lc.getLastSecretHash()).toStrictEqual(secretHash);
  expect(lc.getAllSecretHashes()).toStrictEqual([
    {
      hash: secretHash,
      is_active: true,
    },
  ]);

  const secret2 = "rnp4c74qmuyew71i9zs8hctzcgwu3bdsff8yuhp4mmtianm (*&%^)";
  const secretHash2 = lc.appendSecret(secret2);

  expect(lc.getLastSecretHash()).toStrictEqual(secretHash2);
  expect(lc.getAllSecretHashes()).toStrictEqual([
    {
      hash: secretHash,
      is_active: false,
    },
    {
      hash: secretHash2,
      is_active: true,
    },
  ]);
});

test("push secret & get last & encrypt & decrypt", () => {
  let storage = new LocalStorageMock();
  let lc = new LocalCrypto(kUid, kSessionSecret, storage);

  const secret = "[<nm-fm>]!@#$%^&*()_+";
  const secretHash = lc.appendSecret(secret);
  expect(lc.getLastSecretHash()).toStrictEqual(secretHash);

  const value = {
    theRuleIsThis: {
      that: {
        wherever: "there",
        is: "a decision of a Court",
      },
      of_concurrent: "jurisdiction",
    },
    theOther: "Courts will adopt",
    thatAs: [2, "the", "basis", "of", "their", "decision"],
  };

  const encrypted = lc.encryptObj(value);

  expect(encrypted.hash).toStrictEqual(secretHash);

  const gotValue = lc.decryptObj(encrypted.encrypted, encrypted.hash);

  expect(gotValue).toStrictEqual(value);
});

test("push secret & delete crypto manager & create manager again and see that secret persists", () => {
  let storage = new LocalStorageMock();
  let lc = new LocalCrypto(kUid, kSessionSecret, storage);

  const secret = "1u87nidcbqxo7ytm1u5swogrqy3c9zyjr39t6f4mmf154";
  const secretHash = lc.appendSecret(secret);

  expect(lc.getLastSecretHash()).toStrictEqual(secretHash);
  expect(lc.getAllSecretHashes()).toStrictEqual([
    {
      hash: secretHash,
      is_active: true,
    },
  ]);

  const secret2 = "rnp4c74qmuyew71i9zs8hctzcgwu3bdsff8yuhp4mmtianm (*&%^)";
  const secretHash2 = lc.appendSecret(secret2);

  expect(lc.getLastSecretHash()).toStrictEqual(secretHash2);
  expect(lc.getAllSecretHashes()).toStrictEqual([
    {
      hash: secretHash,
      is_active: false,
    },
    {
      hash: secretHash2,
      is_active: true,
    },
  ]);

  // Recreate crypto manager with the same storage
  lc = new LocalCrypto(kUid, kSessionSecret, storage);

  expect(lc.getLastSecretHash()).toStrictEqual(secretHash2);
  expect(lc.getAllSecretHashes()).toStrictEqual([
    {
      hash: secretHash,
      is_active: false,
    },
    {
      hash: secretHash2,
      is_active: true,
    },
  ]);
});

test("Two crypto managers for different users that share storage should not have collisions", () => {
  let storage = new LocalStorageMock();
  let lc = new LocalCrypto(kUid, kSessionSecret, storage);
  let lc2 = new LocalCrypto(kUid2, kSessionSecret2, storage);

  const secret = "1u87nidcbqxo7ytm1u5swogrqy3c9zyjr39t6f4mmf154";
  const secretHash = lc.appendSecret(secret);

  const secret2 = "p3y7kpqt9wfx4khihzh139e11thx8sg48a9bht3tu5opr";
  const secretHash2 = lc2.appendSecret(secret2);

  expect(lc.getLastSecretHash()).toStrictEqual(secretHash);
  expect(lc.getAllSecretHashes()).toStrictEqual([
    {
      hash: secretHash,
      is_active: true,
    },
  ]);

  expect(lc2.getLastSecretHash()).toStrictEqual(secretHash2);
  expect(lc2.getAllSecretHashes()).toStrictEqual([
    {
      hash: secretHash2,
      is_active: true,
    },
  ]);
});

test("hashes of last secret and all secrets do not collide", () => {
  let storage = new LocalStorageMock();
  let lc = new LocalCrypto(kUid, kSessionSecret, storage);
  expect(lc._getLastSecretHashKey()).not.toStrictEqual(
    lc._getAllSecretsHashesKey()
  );
});

test("init and access singleton", () => {
  let storage = new LocalStorageMock();
  LocalCrypto.initInstance(kUid, kSessionSecret, storage);

  let lc = LocalCrypto.getInstance();

  const secret = "1u87nidcbqxo7ytm1u5swogrqy3c9zyjr39t6f4mmf154";
  const secretHash = lc.appendSecret(secret);

  expect(lc.getLastSecretHash()).toStrictEqual(secretHash);
});
