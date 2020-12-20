import { encrypt, decrypt, sha1, symmetricMakeKeys,
  makeIv,
  symmetricEncrypt,
  symmetricDecrypt,
importSecretBase64Key,
} from "./wrapper";
const { exec } = require("child_process");

// OpenSSL compatible:
// openssl enc -aes-256-cbc -d -pass pass:"passphrase" -base64 -md md5 -in encrypted
// https://wiki.archlinux.org/index.php/OpenSSL#.22bad_decrypt.22_while_decrypting

test("simple enc & dec", () => {
  const inputText = "Hello World";
  const passphrase = "passphrase";

  const encryptedBase64 = encrypt(inputText, passphrase);
  const decryptedText = decrypt(encryptedBase64, passphrase);

  expect(decryptedText).toStrictEqual(inputText);
});

test("simple enc & openssl dec", () => {
  const inputText =
    "It is a capital mistake to theorize before you have all the evidence. It biases the judgment.";
  const passphrase = "a-Scandal/in=Bohemia";

  const encryptedBase64 = encrypt(inputText, passphrase);

  // openssl enc -aes-256-cbc -e -pass pass:'passphrase' -md md5
  // I don't use -base64 option of openssl itself because of line wrap, there is
  // no clear way to turn it off.
  const cmd =
    'echo -n "' +
    encryptedBase64 +
    '" | base64 -d | openssl enc -aes-256-cbc -d -pass pass:"' +
    passphrase +
    '" -md md5';
  exec(cmd, (err, stdout, stderr) => {
    expect(err).toBeNull();
    // expect(stderr).toBeNull();
    expect(stdout).toStrictEqual(inputText);
  });
});

test("simple openssl enc & dec", () => {
  const inputText =
    "I had no idea that such individuals exist outside of stories.";
  const passphrase = "a/study/in/scarlet";

  const encryptedBase64 = encrypt(inputText, passphrase);

  // openssl enc -aes-256-cbc -e -pass pass:'passphrase'  -md md5 | base64 --wrap 0
  // I don't use -base64 option of openssl itself because of line wrap, there is
  // no clear way to turn it off.
  const cmd =
    'echo -n "' +
    inputText +
    '" | openssl enc -aes-256-cbc -e -md md5 -pass pass:"' +
    passphrase +
    '" | base64 --wrap 0';

  exec(cmd, (err, stdout, stderr) => {
    expect(err).toBeNull();
    // expect(stderr).toBeNull();

    const encryptedBase64 = stdout;
    // expect(encryptedBase64).toStrictEqual("");
    const decryptedText = decrypt(stdout, passphrase);
    expect(decryptedText).toStrictEqual(inputText);
  });
});

test("sha1 consistency", async () => {
  const inputText = "https://cryptojs.gitbook.io/docs/";
  const hashValue = await sha1(inputText);
  // echo -n '<inputText>' | sha1sum
  expect(hashValue).toStrictEqual("bf63b52c05b62953bdf32f7bb828964768334004");
});

test("crypto web api: encrypt & decrypt", async () => {
  const key = await symmetricMakeKeys();
  expect(key.type).toStrictEqual("secret");
  expect(key.algorithm.length).toStrictEqual(256,);
  expect(key.algorithm.name).toStrictEqual("AES-CBC");

  const text = "The Nutcracker (ballet), Op.71";

  const iv = makeIv();
  const encrypted = await symmetricEncrypt(key, text, iv);
  const decrypted = await symmetricDecrypt(key, encrypted, iv);
  expect(decrypted).toStrictEqual(text);
});

test("crypto web api: importSecretBase64Key", async () => {
  const base64Key = "TW96aWxsYS81LjAgKFgxMQ==";
  const key = await importSecretBase64Key(base64Key);
});

test("crypto web api: generate random key and wrap it", async () => {
});
