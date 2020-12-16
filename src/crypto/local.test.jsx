import {
  localOnlyCrcSecretPush,
  localOnlyCrcSecretGetAll,
  localOnlyCrcSecretLast,
  localOnlyCrcDecryptObj,
  localOnlyCrcEncryptObj,
} from "./local.jsx";

class LocalStorageMock {
  storage: object;

  constructor() {
    this.storage = {};
  }

  get(key: string): string {
    return this.storage[key];
  }

  set(key: string, value: string): void {
    this.storage[key] = value;
  }
}

test("push secret & get last & get all & push one more", () => {
  let storage = new LocalStorageMock();

  const secret = "<>|<f><n><t>)[<>]!@#$%^&*()_+";
  const secretHash = localOnlyCrcSecretPush(secret, storage);

  expect(localOnlyCrcSecretLast(storage)).toStrictEqual(secretHash);
  expect(localOnlyCrcSecretGetAll(storage)).toStrictEqual([
    {
      hash: secretHash,
      is_active: true,
    },
  ]);

  const secret2 = "rnp4c74qmuyew71i9zs8hctzcgwu3bdsff8yuhp4mmtianm (*&%^)";
  const secretHash2 = localOnlyCrcSecretPush(secret2, storage);

  expect(localOnlyCrcSecretLast(storage)).toStrictEqual(secretHash2);
  expect(localOnlyCrcSecretGetAll(storage)).toStrictEqual([
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

  const secret = "[<nm-fm>]!@#$%^&*()_+";
  const secretHash = localOnlyCrcSecretPush(secret, storage);
  expect(localOnlyCrcSecretLast(storage)).toStrictEqual(secretHash);

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

  const encrypted = localOnlyCrcEncryptObj(value, storage);

  expect(encrypted.hash).toStrictEqual(secretHash);

  const gotValue = localOnlyCrcDecryptObj(
    encrypted.encrypted,
    encrypted.hash,
    storage
  );

  expect(gotValue).toStrictEqual(value);
});
