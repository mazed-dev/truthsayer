import {
  decrypt,
  decryptSignedObject,
  encrypt,
  encryptAndSignObject,
  makeSecret,
  sha1,
  sign,
  verify,
} from "./wrapper.jsx";

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
  // echo -n '<inputText>' | openssl dgst -binary -sha1 | openssl base64
  expect(hashValue).toStrictEqual("v2O1LAW2KVO98y97uCiWR2gzQAQ=");
});

test("sign output", async () => {
  const inputText = "https://cryptojs.gitbook.io/docs/";
  const passphrase = "a/study/in/scarlet";
  const signed = await sign(inputText, passphrase);
  expect(signed).toStrictEqual("Nb92J70G718pEsRDAaMWEfv3AxWHBSXNoWckfuW+RGE=");
});

test("encryptAndSignObject & decryptSignedObject", async () => {
  const inputObject = {
    size: 5381,
    fill: ["abc", -1],
    encoding: "utf8",
  };
  const secretPhrase = "&#0; NUL Null 001 &#1; SOH Start of Header 010 &#2";
  const signaturePhrase = "0F 00001111 &#15;SI Shift In &#16;DLE Data Link";

  const secret: TSecret = makeSecret(secretPhrase, signaturePhrase);

  const encrypted = await encryptAndSignObject(inputObject, secret);
  expect(encrypted.secret_id).toStrictEqual(secret.id);

  const decryptedObject = await decryptSignedObject(encrypted, secret);
  expect(decryptedObject).toStrictEqual(inputObject);
});
